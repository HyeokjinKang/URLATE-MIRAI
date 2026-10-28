import { copyFile } from "node:fs/promises";
import path from "node:path";

// Older URLATE backends still read the blog feed from the site root.
for (const locale of ["", "ko"]) {
  for (const feed of ["rss.xml", "atom.xml"]) {
    const dir = path.resolve("build", locale);
    await copyFile(path.join(dir, "blog", feed), path.join(dir, feed));
  }
}
