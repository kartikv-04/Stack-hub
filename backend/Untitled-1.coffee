project-root/
  src/
    server.ts             # server bootstrap
    app.ts                # express setup, middlewares, routers
    config/
      env.ts              # env loader
      db.ts               # db connection
      logger.ts           # Pino logger
    middlewares/
      errorHandler.ts
      authMiddleware.ts
      validateRequest.ts
    utils/
      ApiError.ts
      asyncHandler.ts
      response.ts
    routes/
      index.ts            # mounts module routers
    modules/
      auth/
        auth.controller.ts
        auth.service.ts
        auth.model.ts
        auth.types.ts
      price-tracker/
        price.controller.ts
        price.service.ts
        price.model.ts
        price.types.ts
      job-aggregator/
        job.controller.ts
        job.service.ts
        job.model.ts
        job.types.ts
      doc-service/
        doc.controller.ts
        doc.service.ts
        doc.model.ts
        doc.types.ts
    tests/
      *.test.ts
  .env.example
  tsconfig.json
  package.json
  .eslintrc.cjs
  .prettierrc
  jest.config.cjs
