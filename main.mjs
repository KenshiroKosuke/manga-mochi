import { downloadEncryptedPages, fetchAndExtract } from "./downloadSignedUrls.mjs";

process.loadEnvFile("./.env");
const { api_session, home_popup_start_time, manga_one_session } = process.env;
const authenticationData = {
  api_session: api_session,
  home_popup_start_time: home_popup_start_time,
  manga_one_session: manga_one_session,
};

const { urls, decryptData } = await fetchAndExtract(
  {
    title_id: "2852",
    chapter_id: "321769",
  },
  authenticationData
);

await downloadEncryptedPages(urls, decryptData, {
  dest: {
    // type: "relative",
    // paths: ["pan_wo_nameruna"]
    type: "absolute",
    path: "D:\\japanese\\Manga-local\\パンをナメるな！\\第10話 限定商品を考えよう",
  },
});
