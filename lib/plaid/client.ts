import { Configuration, CountryCode, PlaidApi, PlaidEnvironments, Products } from 'plaid'

const env = (process.env.PLAID_ENV || 'sandbox') as keyof typeof PlaidEnvironments

const configuration = new Configuration({
  basePath: PlaidEnvironments[env],
  baseOptions: {
    headers: {
      'PLAID-CLIENT-ID': process.env.PLAID_CLIENT_ID!,
      'PLAID-SECRET': process.env.PLAID_SECRET!,
    },
  },
})

export const plaidClient = new PlaidApi(configuration)
export const PLAID_PRODUCTS: Products[] = [Products.Transactions]
export const PLAID_OPTIONAL_PRODUCTS: Products[] = [Products.Investments, Products.Liabilities]
export const PLAID_COUNTRY_CODES: CountryCode[] = [CountryCode.Us]
