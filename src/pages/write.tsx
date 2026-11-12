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
          if (window.top !== window.self) {
            return (
              <main className="container margin-vert--xl">
                <p>
                  글쓰기 도구는 다른 페이지 안에서 열 수 없습니다.{" "}
                  <a href={window.location.href} target="_top">
                    새 창에서 열기
                  </a>
                </p>
              </main>
            );
          }
          const Writer = require("../components/writer/Writer").default;
          return <Writer />;
        }}
      </BrowserOnly>
    </Layout>
  );
}
