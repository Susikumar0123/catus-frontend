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

function encodePathSegment(value) {
    return encodeURIComponent(
        String(value || '').trim()
    );
}

module.exports = async function handler(req, res) {

    const state =
        String(req.query.state || '')
            .trim()
            .toLowerCase();

    const district =
        String(req.query.district || '')
            .trim()
            .toLowerCase();

    const location =
        String(req.query.location || '')
            .trim()
            .toLowerCase();

    const service =
        String(req.query.service || '')
            .trim()
            .toLowerCase();

    const isCleanUrl =
        String(req.query.clean || '') === '1';

    if (
        !state ||
        !district ||
        !location ||
        !service
    ) {
        return res
            .status(400)
            .send('Invalid SEO page');
    }

    try {

        // ==========================================
        // OLD DUPLICATE DISTRICT URL -> CLEAN URL
        //
        // /tamil-nadu/chennai/chennai/tv-repair
        // ->
        // /tamil-nadu/chennai/tv-repair
        // ==========================================

        if (
            district === location &&
            !isCleanUrl
        ) {

            const cleanUrl =
                `https://www.cerood.com/` +
                `${encodePathSegment(state)}/` +
                `${encodePathSegment(district)}/` +
                `${encodePathSegment(service)}`;

            return res.redirect(
                301,
                cleanUrl
            );
        }


        // ==========================================
        // FETCH LOCATION + SERVICE DATA
        // ==========================================

        const apiUrl =
            `https://catus-backend-d2js.onrender.com/api/location-page/` +
            `${encodePathSegment(state)}/` +
            `${encodePathSegment(district)}/` +
            `${encodePathSegment(location)}/` +
            `${encodePathSegment(service)}`;

        const apiResponse =
            await fetch(apiUrl);

        const data =
            await apiResponse.json();

        if (
            !apiResponse.ok ||
            !data.success ||
            !data.page
        ) {
            return res
                .status(404)
                .send('Service page not found');
        }

        const page = data.page;

        // ==========================================
// FETCH RELATED SERVICES FOR SERVER HTML
// ==========================================

let relatedServices = [];

try {

    const servicesResponse =
        await fetch(
            'https://catus-backend-d2js.onrender.com/api/services'
        );

    const servicesData =
        await servicesResponse.json();

    if (
        servicesResponse.ok &&
        servicesData.success &&
        Array.isArray(servicesData.services)
    ) {

        relatedServices =
            servicesData.services
                .filter(item =>
                    item &&
                    item.slug &&
                    String(item.service_id) !==
                        String(page.service_id) &&
                    item.category === page.category
                )
                .slice(0, 4);

        if (relatedServices.length === 0) {

            relatedServices =
                servicesData.services
                    .filter(item =>
                        item &&
                        item.slug &&
                        String(item.service_id) !==
                            String(page.service_id)
                    )
                    .slice(0, 4);
        }
    }

} catch (relatedError) {

    console.error(
        'Server related services error:',
        relatedError
    );
}


        // ==========================================
        // CANONICAL URL
        // ==========================================

        const canonical =
            district === location
                ? (
                    `https://www.cerood.com/` +
                    `${encodePathSegment(state)}/` +
                    `${encodePathSegment(district)}/` +
                    `${encodePathSegment(service)}`
                )
                : (
                    `https://www.cerood.com/` +
                    `${encodePathSegment(state)}/` +
                    `${encodePathSegment(district)}/` +
                    `${encodePathSegment(location)}/` +
                    `${encodePathSegment(service)}`
                );


        // ==========================================
        // SEO TITLE + DESCRIPTION
        // ==========================================

        const title =
            page.seo_title ||
            `${page.service_name} in ${page.location_name}, ${page.district} | Cerood`;

        const description =
            page.seo_description ||
            `${page.service_name} in ${page.location_name}, ${page.district}. Book doorstep service with Cerood.`;


        // ==========================================
        // LOAD PRODUCT PAGE
        // ==========================================

        const productPath =
            path.join(
                process.cwd(),
                'product.html'
            );

        let html =
            fs.readFileSync(
                productPath,
                'utf8'
            );


        // ==========================================
        // TITLE
        // ==========================================

        html = html.replace(
            /<title[^>]*>[\s\S]*?<\/title>/i,
            `<title>${escapeHtml(title)}</title>`
        );


        // ==========================================
        // META DESCRIPTION
        // ==========================================

        const descriptionTag =
            `<meta name="description" content="${escapeHtml(description)}">`;

        if (
            /<meta\s+name=["']description["'][^>]*>/i
                .test(html)
        ) {

            html = html.replace(
                /<meta\s+name=["']description["'][^>]*>/i,
                descriptionTag
            );

        } else {

            html = html.replace(
                '</head>',
                `    ${descriptionTag}\n</head>`
            );
        }


        // ==========================================
        // CANONICAL
        // ==========================================

        const canonicalTag =
            `<link rel="canonical" href="${escapeHtml(canonical)}">`;

        if (
            /<link\s+rel=["']canonical["'][^>]*>/i
                .test(html)
        ) {

            html = html.replace(
                /<link\s+rel=["']canonical["'][^>]*>/i,
                canonicalTag
            );

        } else {

            html = html.replace(
                '</head>',
                `    ${canonicalTag}\n</head>`
            );
        }


        // ==========================================
        // OG URL
        // ==========================================

        const ogUrlTag =
            `<meta property="og:url" content="${escapeHtml(canonical)}">`;

        if (
            /<meta\s+property=["']og:url["'][^>]*>/i
                .test(html)
        ) {

            html = html.replace(
                /<meta\s+property=["']og:url["'][^>]*>/i,
                ogUrlTag
            );

        } else {

            html = html.replace(
                '</head>',
                `    ${ogUrlTag}\n</head>`
            );
        }


        // ==========================================
// SERVER-RENDER H1
// ==========================================

const h1Text =
    `${page.service_name} in ${page.location_name}`;

html = html.replace(
    /<h1([^>]*?)id=["']prodTitle["']([^>]*)>[\s\S]*?<\/h1>/i,
    `<h1$1id="prodTitle"$2>${escapeHtml(h1Text)}</h1>`
);

        // ==========================================
// SERVER-RENDER RELATED SERVICE LINKS
// ==========================================

if (relatedServices.length > 0) {

    const relatedLinksHtml =
        relatedServices
            .map(item => {

                const relatedSlug =
                    String(item.slug || '').trim();

                if (!relatedSlug) {
                    return '';
                }

                const relatedUrl =
                    district === location
                        ? (
                            `/${encodePathSegment(state)}/` +
                            `${encodePathSegment(district)}/` +
                            `${encodePathSegment(relatedSlug)}`
                        )
                        : (
                            `/${encodePathSegment(state)}/` +
                            `${encodePathSegment(district)}/` +
                            `${encodePathSegment(location)}/` +
                            `${encodePathSegment(relatedSlug)}`
                        );

                return `
                    <a class="uc-card"
                       href="${escapeHtml(relatedUrl)}"
                       style="text-decoration:none;color:inherit;">
                        <div class="uc-body">
                            <h4>${escapeHtml(item.service_name)}</h4>
                        </div>
                    </a>
                `;

            })
            .join('');

    html = html.replace(
        /<div([^>]*?)id=["']relatedContainer["']([^>]*)>[\s\S]*?<\/div>/i,
        `<div$1id="relatedContainer"$2>${relatedLinksHtml}</div>`
    );
}

// ==========================================
// SERVER-RENDER SEO SCHEMA
// ==========================================

const seoPlaceName =
    page.location_name ||
    page.district ||
    location;

const serverSchema = {
    "@context": "https://schema.org",
    "@graph": [
        {
            "@type": "Service",
            "@id": `${canonical}#service`,
            "name": `${page.service_name} in ${seoPlaceName}`,
            "description": description,
            "url": canonical,
            "image": page.image_url || undefined,
            "provider": {
                "@type": "Organization",
                "name": "Cerood Home Services",
                "url": "https://www.cerood.com/"
            },
            "areaServed": {
                "@type": "Place",
                "name": seoPlaceName
            },
            "serviceType": page.service_name
        },
        {
            "@type": "BreadcrumbList",
            "itemListElement": [
                {
                    "@type": "ListItem",
                    "position": 1,
                    "name": "Home",
                    "item": "https://www.cerood.com/"
                },
                {
                    "@type": "ListItem",
                    "position": 2,
                    "name": `${page.service_name} in ${seoPlaceName}`,
                    "item": canonical
                }
            ]
        }
    ]
};

const schemaTag =
    `<script type="application/ld+json" id="ceroodServerSeoSchema">` +
    `${JSON.stringify(serverSchema)}` +
    `</script>`;

html = html.replace(
    '</head>',
    `    ${schemaTag}\n</head>`
);


        // ==========================================
        // RESPONSE
        // ==========================================

        res.setHeader(
            'Content-Type',
            'text/html; charset=utf-8'
        );

        res.setHeader(
            'Cache-Control',
            'public, s-maxage=3600, stale-while-revalidate=86400'
        );

        return res
            .status(200)
            .send(html);

    } catch (error) {

        console.error(
            'SEO product render error:',
            error
        );

        return res
            .status(500)
            .send(
                'Unable to render service page'
            );
    }
};