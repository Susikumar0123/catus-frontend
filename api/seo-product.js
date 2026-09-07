const fs = require('fs');
const path = require('path');

function escapeHtml(value) {
    return String(value || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

module.exports = async function handler(req, res) {

    const state = String(req.query.state || '').trim();
    const district = String(req.query.district || '').trim();
    const location = String(req.query.location || '').trim();
    const service = String(req.query.service || '').trim();

    if (!state || !district || !location || !service) {
        return res.status(400).send('Invalid SEO page');
    }

    try {

        const apiUrl =
            `https://catus-backend-d2js.onrender.com/api/location-page/` +
            `${encodeURIComponent(state)}/` +
            `${encodeURIComponent(district)}/` +
            `${encodeURIComponent(location)}/` +
            `${encodeURIComponent(service)}`;

        const apiResponse = await fetch(apiUrl);
        const data = await apiResponse.json();

        if (
            !apiResponse.ok ||
            !data.success ||
            !data.page
        ) {
            return res.status(404).send('Service page not found');
        }

        const page = data.page;

        const canonical =
            `https://www.cerood.com/` +
            `${state}/${district}/${location}/${service}`;

        const title =
            page.seo_title ||
            `${page.service_name} in ${page.location_name}, ${page.district} | Cerood`;

        const description =
            page.seo_description ||
            `${page.service_name} in ${page.location_name}, ${page.district}. Book doorstep service with Cerood.`;

        const productPath =
            path.join(process.cwd(), 'product.html');

        let html =
            fs.readFileSync(productPath, 'utf8');

        html = html.replace(
            /<title[^>]*>[\s\S]*?<\/title>/i,
            `<title>${escapeHtml(title)}</title>`
        );

        html = html.replace(
            /<meta\s+name=["']description["'][^>]*>/i,
            `<meta name="description" content="${escapeHtml(description)}">`
        );

        const canonicalTag =
            `<link rel="canonical" href="${escapeHtml(canonical)}">`;

        html = html.replace(
            '</head>',
            `    ${canonicalTag}\n</head>`
        );

        res.setHeader(
            'Content-Type',
            'text/html; charset=utf-8'
        );

        res.setHeader(
            'Cache-Control',
            'public, s-maxage=3600, stale-while-revalidate=86400'
        );

        return res.status(200).send(html);

    } catch (error) {

        console.error(
            'SEO product render error:',
            error
        );

        return res.status(500).send(
            'Unable to render service page'
        );
    }
};