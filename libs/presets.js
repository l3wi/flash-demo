// const prod = process.env.NODE_ENV === 'production'
const prod = false

export default {
  API: prod
    ? 'https://satoshipay.iotaledger.net/'
    : 'https://satoshipay.iotaledger.net/',
  ADDRESS: `GQMHDLS9XPSNURUCPKKJJTULZRPH9WSKUKQQQPJOY9CPRCNAUSIFWCLHVDSUHJJCPMQDARUIFFXKXFVQD`,
  IOTA: prod ? 'https://node.tangle.works' : 'https://testnet140.tangle.works',
  PROD: prod ? true : false
}
//http://52.58.212.188:14700
