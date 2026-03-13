/**
 * GraphQL API Support
 */
export const graphqlApi = {
  schema: `type Account { id: ID!, name: String!, email: String! }\n type Query { accounts: [Account!]! }\n type Mutation { addAccount(name: String!, email: String!): Account! }`,
  async query(query: string): Promise<unknown> { return { data: {} }; },
  async mutate(mutation: string): Promise<unknown> { return { data: {} }; },
};