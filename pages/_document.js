import Document, { Head, Main, NextScript } from "next/document"
import { ServerStyleSheet, injectGlobal } from "styled-components"

export default class MyDocument extends Document {
  render() {
    const sheet = new ServerStyleSheet()
    const main = sheet.collectStyles(<Main />)
    const styleTags = sheet.getStyleElement()
    return (
      <html>
        <Head>
          <title>Flash - Instant payment channels</title>
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <script src={"/static/curl.min.js"} />
          <link rel="icon" type="image/png" href="/static/favicon.ico" />
          {styleTags}
        </Head>
        <body>
          <div className="root">{main}</div>
          <NextScript />
        </body>
      </html>
    )
  }
}

injectGlobal`
  body {
    margin: 0 auto;
    font-family: avenir;
    -webkit-font-smoothing: antialiased;
    font-smoothing: antialiased;
  }
`
