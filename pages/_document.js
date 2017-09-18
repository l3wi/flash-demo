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
          <script
            dangerouslySetInnerHTML={{
              __html: `(function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){(i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)})(window,document,'script','https://www.google-analytics.com/analytics.js','ga');ga('create', 'UA-106570081-1', 'auto');ga('send', 'pageview');`
            }}
          />
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
