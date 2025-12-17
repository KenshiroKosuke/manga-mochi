import fs from "fs";
import crypto from "crypto";
import path from "path";
import { setTimeout } from "timers/promises";

/**
 * @typedef AuthenticationData
 * @prop {string} api_session
 * @prop {string} manga_one_session
 * @prop {string|number} home_popup_start_time
 */

/**
 * @typedef ChapterQuery
 * @prop {string|number} title_id
 * @prop {string|number} chapter_id
 */

/**
 * @param {ChapterQuery} chapterQuery
 * @param {AuthenticationData} authenticationData
 * @returns {Promise<{urls: string[], decryptData: AESDecryptData}>}
 */
export async function fetchAndExtract(
  { title_id, chapter_id },
  { api_session, home_popup_start_time, manga_one_session }
) {
  // You can change these headers to whatever. I just grab them from my browser.
  // If you get error fetching this endpoint, try opening mangaone in browser, look in DevTool and see the if there are any differences here and there.
  const result = await fetch(
    `https://manga-one.com/api/client?rq=viewer_v2&title_id=${title_id}&chapter_id=${chapter_id}&page=1&limit=10&sort_type=desc&list_type=chapter&free_point=0&event_point=0&paid_point=0`,
    {
      headers: {
        accept: "*/*",
        "accept-language": "en-US,en;q=0.9,ja;q=0.8,th;q=0.7,ar;q=0.6",
        "cache-control": "no-cache",
        pragma: "no-cache",
        priority: "u=1, i",
        "sec-ch-ua": '"Microsoft Edge";v="143", "Chromium";v="143", "Not A(Brand";v="24"',
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": '"Windows"',
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "same-origin",
        cookie: `api_session=${api_session}; is_logged_in=true; is_app_connected=true; home_popup_start_time=${home_popup_start_time}; manga_one_session=${manga_one_session}`,
        Referer: `https://manga-one.com/manga/${title_id}/chapter/${chapter_id}?type=chapter&sort_type=desc&page=1&limit=10`,
      },
      body: null,
      method: "POST",
    }
  );

  if (!result.ok) {
    console.log("result.statusText: ", result.statusText);
    throw new Error("Cannot fetch from MangaOne");
  }

  const buffer = await result.arrayBuffer();
  const decoder = new TextDecoder("utf-8");
  const rawText = decoder.decode(buffer);
  const dynamicRegex = new RegExp(
    `https:\\/\\/app\\.manga-one\\.com\\/[^"'\\s\\x00-\\x1F]*?\\/manga_page_low\\/${chapter_id}\\/[^"'\\s\\x00-\\x1F]*`,
    "g"
  );
  const urls = rawText.match(dynamicRegex) || [];
  console.log(`Found ${urls.length} pages:`);
  console.log(urls);
  const keyMatch = rawText.match(/[a-f0-9]{64}/);
  if (!keyMatch) {
    throw new Error("Could not find the Encryption Key in response!");
  }
  const hexKey = keyMatch[0];
  console.log("Found Key:", hexKey);
  const textWithoutKey = rawText.replace(hexKey, "");
  const ivMatch = textWithoutKey.match(/[a-f0-9]{32}/);
  if (!ivMatch) {
    throw new Error("Could not find the IV in response!");
  }
  const hexIv = ivMatch[0];
  console.log("Found IV:", hexIv);
  return { urls, decryptData: { hexKey: hexKey, hexIv: hexIv } };
}

/**
 * @typedef AESDecryptData
 * @prop {string} hexKey
 * @prop {string} hexIv
 */

/**
 *
 * @param {string} url
 * @param {AESDecryptData} decryptData
 * @param {string} absoluteDest
 */
export async function decryptMangaPage(url, decryptData, absoluteDest) {
  console.log("Downloading encrypted file...");

  // 1. Fetch
  // NOTE 2025-12-17 : cookie is not needed
  const response = await fetch(url);
  if (!response.ok) {
    console.error(response.statusText);
    throw new Error(`Fetch failed: ${response.status}`);
  }

  // 2. Get encrypted bytes
  const encryptedBuffer = await response.arrayBuffer();

  // 3. Prepare Key and IV buffers
  const key = Buffer.from(decryptData.hexKey, "hex");
  const iv = Buffer.from(decryptData.hexIv, "hex");

  // 4. Create Decipher
  // Algorithm is likely 'aes-256-cbc'.
  // If this fails, the other common option is 'aes-256-ctr'.
  const decipher = crypto.createDecipheriv("aes-256-cbc", key, iv);
  let decrypted = Buffer.concat([decipher.update(Buffer.from(encryptedBuffer)), decipher.final()]);

  // 5. Save to file
  fs.writeFileSync(absoluteDest, decrypted);
  console.log(`Saved: ${absoluteDest}`);
}

/**
 * @typedef SavePageOptions
 * @prop {{type: "absolute", path: string}|{type: "relative", paths: string[]}|undefined} dest
 */

/**
 * @param {string[]} urls
 * @param {AESDecryptData} decryptData
 * @param {SavePageOptions} savePageOptions
 */
export async function downloadEncryptedPages(urls, decryptData, { dest }) {
  let pathToJoin = [];
  if (dest == undefined) {
    pathToJoin = [import.meta.dirname, "temp"];
  } else if (dest.type == "absolute") {
    pathToJoin = [dest.path];
  } else {
    pathToJoin = [import.meta.dirname, ...dest.paths];
  }
  const parentDir = path.join(...pathToJoin);
  fs.mkdirSync(parentDir, { recursive: true });
  const pageLength = urls.length;
  for (let index = 0; index < pageLength; index++) {
    const url = urls[index];
    const absoluteDest = path.join(parentDir, `page_${(index + 1).toString().padStart(3, "0")}.webp`);
    await decryptMangaPage(url, decryptData, absoluteDest);
    console.log("Cooldown");
    await setTimeout(500);
  }
}
