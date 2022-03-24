import "reflect-metadata";
import { GraphQLUpload, graphqlUploadExpress } from "graphql-upload"
import readSchemas from "./src/utils/readSchema";
import { createConnection } from "typeorm";
import { ApolloServer, gql } from "apollo-server-express";
import mutationResolvers from "./src/resolvers/mutation";
import queryResolvers from "./src/resolvers/query";
import isAuth from "./src/middleware/auth";
import express, { application, Request } from "express";
import cors from "cors";
import dotenv from "dotenv";
import { PostgresConnectionOptions } from "typeorm/driver/postgres/PostgresConnectionOptions";
import http from "http";
import { User } from "./src/@types/express/entity/User";
import { Post } from "./src/@types/express/entity/Post";
import { ApolloServerPluginDrainHttpServer } from "apollo-server-core/dist/plugin/drainHttpServer";

dotenv.config();

//setting up the middleware
const app = express();
app.use(cors({ credentials: true, origin: "http://localhost:3000" }) as any);
app.use(graphqlUploadExpress({ maxFileSize: 10000000, maxFiles: 20 }) as any);
app.use(isAuth);

const allSchemas = readSchemas(
  "./src/schemas/post.gql",
  "./src/schemas/user.gql",
  "./src/schemas/mutation.gql",
  "./src/schemas/query.gql",

);
const typeDefs = gql(allSchemas.join());
const resolvers = {
  Upload: GraphQLUpload,
  ...mutationResolvers,
  ...queryResolvers,
};
const createServer = (httpServer) => {
  return new ApolloServer({
    typeDefs,
    resolvers,
    introspection: true,
    plugins: [ApolloServerPluginDrainHttpServer({ httpServer })],
    context: ({ req }: { [key: string]: Request }) => ({
      req,
    }),
  });
};

//the config is here because typeorm couldn't find the names of the databases in ormconfig.js
const ormConfig: PostgresConnectionOptions[] = [
  {
    host: "localhost",
    type: "postgres",
    port: 5400,
    username: "test",
    password: "test",
    database: "test",
    logging: false,
    entities: [User, Post],
    migrations: ["src/migration/**/*.ts"],
    subscribers: ["src/subscriber/**/*.ts"],
    synchronize: false,
    ssl: {
      rejectUnauthorized: false
    },

    //dropSchema: true,
    cli: {
      entitiesDir: "src/entity",
      migrationsDir: "src/migration",
      subscribersDir: "src/subscriber",
    },
  },
  {
    url: process.env.DATABASE_URL,
    type: "postgres",
    synchronize: true,
    port: 5432,
    //TODO: test
    entities: [User, Post],
    migrations: ["src/migration/**/*.ts"],
    subscribers: ["src/subscriber/**/*.ts"],
    cli: {
      entitiesDir: "src/entity",
      migrationsDir: "src/migration",
      subscribersDir: "src/subscriber",
    },
    ssl: {
      rejectUnauthorized: false
    }
  },
];

const startServer = async () => {
  const port = process.env.PORT || 8000;
  const httpServer = http.createServer(app);

  const server = createServer(httpServer);
  await server.start();
  await createConnection(
    ormConfig[1]
    /*process.env.NODE_ENV === "development"
      ? //local database
        (ormConfig[0] as PostgresConnectionOptions)
      : //heroku database
        (ormConfig[1] as PostgresConnectionOptions)*/
  );



  //TOOD: custom store (redis)

  //setting cors to false so apollo server does not override the cors settings
  server.applyMiddleware({ app, cors: false });
  console.log(`PORT: ${process.env.DATABASE_URL}`)


  //server.installSubscriptionHandlers(httpServer);
  httpServer.listen(
    port /*() => {
    console.log(`Listening to port: ${port}${server.graphqlPath}`);
    console.log(
      `Subscriptions ready at ws://localhost:${port}${server.subscriptionsPath}`
    );
  }*/
  );
};


export default startServer;

