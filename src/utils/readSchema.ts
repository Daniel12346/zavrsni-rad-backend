import { readFileSync } from "fs";

//TODO: async schema reading

const readSchemas = (...schemaPaths: string[]) =>
  //returns an array of resolved promises of the schema paths
  [...schemaPaths].map((path) => readFileSync(path));

export default readSchemas;
