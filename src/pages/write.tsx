import React from "react";
import Head from "@docusaurus/Head";
import Layout from "@theme/Layout";
import BrowserOnly from "@docusaurus/BrowserOnly";

export default function Write() {
  return (
    <Layout title="글쓰기" noFooter>
      <Head>
        <meta name="robots" content="noindex, nofollow" />
      </Head>
      <BrowserOnly>
        {() => {
          const Writer = require("../components/writer/Writer").default;
          return <Writer />;
        }}
      </BrowserOnly>
    </Layout>
  );
}
