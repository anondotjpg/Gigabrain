import { buildUrl } from "@/utils/buildUrl";
import Head from "next/head";

export const Meta = () => {
  const title = "frens | digital companions";
  const description =
    "interact with your internet frens";
  const imageUrl = "/d.png";
  const faviconUrl = "/d.ico";  // Replace with your favicon path if different

  return (
    <Head>
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={imageUrl} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={imageUrl} />

      {/* Favicon */}
      <link rel="icon" href={faviconUrl} />
    </Head>
  );
};