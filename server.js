const http = require("http");

function cleanText(str) {
  return str.replace(/<[^>]*>/g, "") 
    .replace(/\s+/g, " ")
    .trim();
}

function isValidArticle(link) {
  if (!link.startsWith("https://time.com/")) return false;

  const id = link.replace("https://time.com/", "").split("/")[0];
  return /^\d{6,}$/.test(id); 
}

async function getTimeStories() {
  const response = await fetch("https://time.com");
  const html = await response.text();

  const stories = [];
  const seen = new Set();

  let pos = 0;

  while (stories.length < 6) {
    const aTag = html.indexOf("<a ", pos);
    if (aTag === -1) break;

    const hrefStart = html.indexOf('href="', aTag);
    if (hrefStart === -1) break;

    const linkStart = hrefStart + 6;
    const linkEnd = html.indexOf('"', linkStart);
    if (linkEnd === -1) break;

    let link = html.slice(linkStart, linkEnd);

    const titleStart = html.indexOf(">", linkEnd) + 1;
    const titleEnd = html.indexOf("</a>", titleStart);
    if (titleStart === 0 || titleEnd === -1) {
      pos = linkEnd;
      continue;
    }

    const title = cleanText(html.slice(titleStart, titleEnd));

    if (link.startsWith("/")) link = "https://time.com" + link;
    if (!isValidArticle(link) || !title) {
      pos = linkEnd;
      continue;
    }

    if (!seen.has(link)) {
      stories.push({ title, link });
      seen.add(link);
    }

    pos = linkEnd;
  }

  return stories;
}

const server = http.createServer(async (req, res) => {
  if (req.url === "/getTimeStories") {
    try {
      const data = await getTimeStories();
      res.writeHead(200, {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      });
      res.end(JSON.stringify(data, null, 2));
    } catch (err) {
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Failed to fetch stories" }));
    }
  } else {
    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Not Found" }));
  }
});

server.listen(3000, () => {
  console.log("Server running at http://localhost:3000/getTimeStories");
});
