# Google Search visibility

The public search URL is:

`https://z750sasr.github.io/mchose-a5-pro-max-web-driver/`

The GitHub Pages build includes:

- A search-focused title and description for the first-generation MCHOSE A5 Pro Max driver
- A canonical URL so the public GitHub Pages address is treated as the primary page
- Indexable HTML describing the driver before JavaScript runs
- Open Graph and X sharing metadata
- `WebApplication` structured data
- `sitemap.xml` containing the canonical driver page
- Crawl-permission metadata and a project-level `robots.txt`
- `noindex` on the blank About document so it does not compete with the main page

## Submit the site to Google

Search optimization cannot guarantee a ranking or make a new page appear immediately. Complete this one-time submission after deployment:

1. Open [Google Search Console](https://search.google.com/search-console/).
2. Add a **URL-prefix property** using the complete project URL above.
3. Choose **HTML file** verification.
4. Download Google's verification file and place it in `web-driver-app/public/` without renaming it.
5. Commit and push the file, wait for GitHub Pages to deploy, and then press **Verify** in Search Console.
6. Open **Sitemaps** and submit:

   `https://z750sasr.github.io/mchose-a5-pro-max-web-driver/sitemap.xml`

7. Use **URL inspection** for the main project URL and select **Request indexing**.

The HTML file method is recommended for this GitHub project site because it does not require changing DNS. Keep the verification file in `public/` after verification.

## Improve ranking over time

- Link to the public driver URL from the GitHub repository description and relevant MCHOSE documentation.
- Keep the hardware support list and driver features accurate.
- Encourage legitimate links from mouse communities or first-generation A5 support discussions.
- Avoid repeating search phrases unnaturally or adding hidden content.
- Re-submit the URL after meaningful content changes rather than after every minor code update.
