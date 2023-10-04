const fs = require("fs");
const path = require("path");
const yaml = require("js-yaml");

const { DynamoDBModelTransformer } = require("graphql-dynamodb-transformer");
const {
  SearchableModelTransformer,
} = require("graphql-elasticsearch-transformer");
const {
  ModelConnectionTransformer,
} = require("graphql-connection-transformer");
const { ModelAuthTransformer } = require("graphql-auth-transformer");
const { GraphQLTransform } = require("graphql-transformer-core");
const { KeyTransformer } = require("graphql-key-transformer");

const SCHEMA = fs.readFileSync("schema.src.graphql").toString();

// Fix issue with Feature flag
const featureProvider = {
  getBoolean: function(str){
    return true;
  }

}

const transformer = new GraphQLTransform({
  transformers: [
    new DynamoDBModelTransformer(),
    new KeyTransformer(),
    new ModelConnectionTransformer(),
    new ModelAuthTransformer({
      authConfig: {
        defaultAuthentication: {
          authenticationType: "AMAZON_COGNITO_USER_POOLS",
        },
      },
    }),
    new SearchableModelTransformer(),
  ],
  featureFlags: featureProvider
});

const out = transformer.transform(SCHEMA);
const templateFolder = "./out/mapping-templates";
const stackFolder = "./out/stacks";

fs.mkdir(templateFolder, { recursive: true }, (err) => {
  if (err) throw err;
});

fs.mkdir(stackFolder, { recursive: true }, (err) => {
  if (err) throw err;
});

fs.writeFileSync("./out/transformer.json", JSON.stringify(out, null, 2));

fs.writeFileSync("./out/schema.graphql", out.schema);

Object.keys(out.resolvers).forEach((key) => {
  const vtl = out.resolvers[key];
  fs.writeFileSync(path.resolve("./out/mapping-templates", key), vtl);
});

Object.keys(out.stacks).forEach((key) => {
  const stack = out.stacks[key];
  //    console.log(key);
  fs.writeFileSync(
    path.resolve("./out/stacks", key + ".yaml"),
    yaml.dump(stack)
  );
});
