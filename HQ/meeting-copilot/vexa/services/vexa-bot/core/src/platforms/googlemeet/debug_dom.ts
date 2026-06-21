import { Page } from "playwright";
import * as fs from "fs";

export async function dumpDOM(page: Page) {
  try {
    const html = await page.content();
    fs.writeFileSync('/app/storage/screenshots/dom_dump.html', html);
  } catch (e) {
    console.error(e);
  }
}
