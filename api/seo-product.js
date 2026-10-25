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

    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('X-Cerood-Service-Copy', 'dharmapuri-booking-v4');

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
        [req.query.state, req.query.district, req.query.location, req.query.service]
            .some(value => typeof value !== 'string') ||
        ![state, district, location, service].every(value => /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value))
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
            await fetch(apiUrl, {signal: AbortSignal.timeout(10000)});

        // A temporary upstream failure is not a missing page.
        if (apiResponse.status === 404) {
            res.setHeader('X-Robots-Tag', 'noindex');
            return res.status(404).send('Service page not found');
        }
        if (!apiResponse.ok) throw new Error('Service data temporarily unavailable');
        const data = await apiResponse.json();
        if (!data.success || !data.page || !data.page.service_name) {
            throw new Error('Incomplete service data');
        }
        const page = data.page;

        // ==========================================
// FETCH RELATED SERVICES FOR SERVER HTML
// ==========================================

let relatedServices = [];
let applianceServices = [];

try {

    const servicesResponse =
        await fetch(
            'https://catus-backend-d2js.onrender.com/api/home-services',
            {signal: AbortSignal.timeout(5000)}
        );

    const servicesData =
        await servicesResponse.json();

    if (
        servicesResponse.ok &&
        servicesData.success &&
        Array.isArray(servicesData.services)
    ) {

        applianceServices = servicesData.services;

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

        const displayPlace = value => String(value || '').split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
const districtName = String(page.district || displayPlace(district)).trim();
const locationName = String(page.location_name || displayPlace(location)).trim();
const seoLocation = district === location || locationName.toLowerCase() === districtName.toLowerCase()
    ? districtName : `${locationName}, ${districtName}`;

// Search-result metadata only.
// This does not add or change any visible product-page content.
const serviceName = String(page.service_name || '').trim();

// Search Console shows users can use "fridge" wording for refrigerator services.
// Keep the visible page/service name unchanged and use the consumer-friendly
// synonym only in search-result metadata for refrigerator service pages.
const isRefrigeratorService = /refrigerator/i.test(serviceName);
const searchServiceName = isRefrigeratorService
    ? serviceName.replace(/refrigerator/ig, 'Fridge')
    : serviceName;
const searchServiceNameLower = searchServiceName.toLowerCase();

// AC-specific search metadata only. This preserves the visible page, H1,
// canonical URL and routing while making the snippet clearer for AC intent.
const isACService = /(^|\s)ac($|\s|-)|air conditioner/i.test(serviceName);

// Washing-machine-specific search metadata only. Keep the visible product page
// untouched while making repair / installation intent clearer in Google results.
const isWashingMachineService = /washing machine|washer/i.test(serviceName);

// Focus this change on the Chennai TV-repair landing page only.
const isChennaiTVRepair = state === 'tamil-nadu' && district === 'chennai'
    && location === 'chennai' && service === 'tv-repair';
const title = isChennaiTVRepair
    ? 'TV Repair in Chennai | Smart TV Service | Cerood'
    : `${searchServiceName} in ${seoLocation} | Cerood`;

// RO / water-purifier-specific search metadata only. Search Console already
// shows installation, service, pump-repair and near-me intent across these URLs.
// Preserve each exact service name instead of forcing one generic RO keyword.
const isROService = /(^|\s)ro($|\s|-)|water purifier/i.test(serviceName);

// Match the service families used by the product UI; do not describe beauty as repair.
const familyText = [page.service_name,page.name,page.slug,page.service_slug,page.category_name,page.category,page.group_name,page.service_family]
    .filter(Boolean).join(' ').toLowerCase().replace(/[^a-z0-9]+/g,' ');
const serviceFamily = /\b(massage|spa|wellness|ayurveda|ayurvedic|herbal compress|postnatal|post natal|senior comfort|elderly care|comfort therapy|body scrub|arm scrub)\b/.test(familyText)
    ? 'wellness' : /\b(salon|beauty|pedicure|manicure|waxing|roll on wax|spatula wax|facial|cleanup|clean up|threading|haircut|hair spa|bridal|makeup)\b/.test(familyText) ? 'beauty' : 'home';
const professional = serviceFamily === 'beauty' ? 'beauty professional' : serviceFamily === 'wellness' ? 'wellness professional' : 'technician';
const approvalText = serviceFamily === 'home'
    ? 'Visit charges and any repair quote are shared for approval before proceeding.'
    : 'Appointment availability, service details and charges are confirmed before the service.';
const description = isChennaiTVRepair
    ? 'TV not turning on, no picture or no sound? Request Smart TV repair in Chennai. Call 8946055856 to confirm availability and inspection charges.'
    : serviceFamily === 'home'
    ? `Book ${searchServiceNameLower} in ${seoLocation} with Cerood. Call 8946055856 to check availability. Visit charges and repair quotes are shared for approval.`
    : `Book ${searchServiceNameLower} in ${seoLocation} with Cerood. Call 8946055856 to check appointment availability, service details and charges.`;

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
            `<title id="pageTitle">${escapeHtml(title)}</title>`
        );


        // ==========================================
        // META DESCRIPTION
        // ==========================================

        const descriptionTag =
            `<meta name="description" content="${escapeHtml(description)}">`;

        html = html.replace(/<meta\b(?=[^>]*\bname=["']description["'])[^>]*>/gi, '');
        html = html.replace('</head>', `${descriptionTag}\n</head>`);

        // ==========================================
        // CANONICAL
        // ==========================================

        const canonicalTag =
            `<link rel="canonical" href="${escapeHtml(canonical)}">`;

        html = html.replace(/<link\b(?=[^>]*\brel=["']canonical["'])[^>]*>/gi, '');
        html = html.replace('</head>', `${canonicalTag}\n</head>`);

        // ==========================================
        // OG URL
        // ==========================================

        const socialValues = {'og:url':canonical, 'og:title':title, 'og:description':description, 'og:type':'website', 'og:site_name':'Cerood'};
        if (page.image_url && /^https?:\/\//i.test(page.image_url)) {
            socialValues['og:image'] = page.image_url;
            socialValues['og:image:alt'] = `${serviceName} in ${seoLocation}`;
        }
        for (const [property, value] of Object.entries(socialValues)) {
            const pattern = new RegExp('<meta\\b(?=[^>]*\\bproperty=["\']' + property + '["\'])[^>]*>', 'gi');
            html = html.replace(pattern, '');
            html = html.replace('</head>', `<meta property="${property}" content="${escapeHtml(value)}">\n</head>`);
        }

// ==========================================
// ROBOTS + SOCIAL META (HEAD ONLY)
// ==========================================

const robotsTag =
    `<meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1">`;

if (/<meta\b(?=[^>]*\bname=["']robots["'])[^>]*>/i.test(html)) {
    html = html.replace(
        /<meta\b(?=[^>]*\bname=["']robots["'])[^>]*>/i,
        robotsTag
    );
} else {
    html = html.replace('</head>', `    ${robotsTag}\n</head>`);
}

const ogDescriptionTag =
    `<meta property="og:description" content="${escapeHtml(description)}">`;

if (/<meta\s+property=["']og:description["'][^>]*>/i.test(html)) {
    html = html.replace(
        /<meta\s+property=["']og:description["'][^>]*>/i,
        ogDescriptionTag
    );
} else {
    html = html.replace('</head>', `    ${ogDescriptionTag}\n</head>`);
}

const twitterTitleTag =
    `<meta name="twitter:title" content="${escapeHtml(title)}">`;
const twitterDescriptionTag =
    `<meta name="twitter:description" content="${escapeHtml(description)}">`;

html = html.replace(/<meta\b(?=[^>]*\bname=["']twitter:title["'])[^>]*>/gi, '');
html = html.replace(/<meta\b(?=[^>]*\bname=["']twitter:description["'])[^>]*>/gi, '');
html = html.replace(
    '</head>',
    `    ${twitterTitleTag}\n    ${twitterDescriptionTag}\n</head>`
);

// ==========================================
// SEO TITLE + OPEN GRAPH TITLE
// ==========================================

// The SEO title was already generated above.
// Do not overwrite it again.

html = html.replace(
    /<meta\s+property=["']og:title["'][^>]*>/i,
    `<meta property="og:title" content="${escapeHtml(title)}">`
);
        // ==========================================
// SERVER-RENDER H1
// ==========================================

// Keep the customer-facing heading consistent with the frontend.
// Location remains in SEO metadata and the existing location controls.
const h1Text = page.service_name;

html = html.replace(
    /<h1([^>]*?)id=["']prodTitle["']([^>]*)>[\s\S]*?<\/h1>/i,
    `<h1$1id="prodTitle"$2>${escapeHtml(h1Text)}</h1>`
);

// ==========================================
// SERVER-RENDER LOCAL SEO CONTENT
// ==========================================

let localIntro = `<section id="ceroodLocalServiceIntro" aria-label="Service in ${escapeHtml(seoLocation)}" style="margin:10px 0 14px;font-size:14px;line-height:1.6;color:#475569"><p>${escapeHtml(serviceName)} in ${escapeHtml(seoLocation)}. Contact Cerood to confirm ${escapeHtml(professional)} availability. ${escapeHtml(approvalText)}</p></section>`;
if (isChennaiTVRepair) {
    localIntro = `<section id="ceroodLocalServiceIntro" aria-label="TV repair in Chennai" style="margin:10px 0 14px;font-size:14px;line-height:1.6;color:#475569">
<p>Need Smart TV repair in Chennai? Tell Cerood your TV brand, model, problem and service address so we can check technician availability in your area.</p>
<details style="margin:8px 0"><summary style="cursor:pointer;font-weight:600">What to share before booking</summary><p>Tell us if the TV will not turn on, has sound without a picture, has no sound, or has a display issue. Share the screen size and when the problem started. The cause and repair options need technician assessment.</p></details>
<details style="margin:8px 0"><summary style="cursor:pointer;font-weight:600">Inspection and repair charges</summary><p>Confirm the visit or inspection charge before booking. After assessment, ask for the repair estimate, any spare-part costs and applicable warranty terms before approving the work.</p></details>
<a href="tel:+918946055856" data-cerood-contact="call" style="display:inline-block;padding:10px 14px;border:1px solid #cbd5e1;border-radius:8px;color:#143f85;font-weight:600;text-decoration:none">Call about TV repair: 89460 55856</a>
</section>`;
}
// Local booking guidance for Dharmapuri appliance pages; no invented prices,
// response times, technician credentials or warranty promises.
const isDharmapuriAppliance = state === 'tamil-nadu' && district === 'dharmapuri'
    && location === district && serviceFamily === 'home'
    && (isACService || isRefrigeratorService || isWashingMachineService || isROService || service === 'tv-repair');
if (isDharmapuriAppliance) {
    const issueHint = isACService ? 'cooling, water leakage, unusual noise or power issues'
        : isRefrigeratorService ? 'cooling, water leakage, unusual noise or power issues'
        : isWashingMachineService ? 'draining, spinning, water leakage or power issues'
        : isROService ? 'water flow, leakage, filter replacement or installation needs'
        : 'power, picture, sound or display issues';
    localIntro = `<section id="ceroodLocalServiceIntro" aria-label="Service in Dharmapuri" style="margin:10px 0 14px;font-size:14px;line-height:1.6;color:#475569">
<p>${escapeHtml(serviceName)} in Dharmapuri. Share your appliance brand, model and ${escapeHtml(issueHint)} so Cerood can check the appropriate service and technician availability.</p>
<details style="margin:8px 0"><summary style="cursor:pointer;font-weight:600">Visit and repair charges</summary><p>Confirm the visit or inspection charge before booking. Ask for the repair estimate, spare-part costs and any applicable warranty terms before approving work.</p></details>
<details style="margin:8px 0"><summary style="cursor:pointer;font-weight:600">Booking in your area</summary><p>Share your Dharmapuri locality and preferred visit time when you contact us. Availability and the appointment time need confirmation before the visit.</p></details>
<div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:10px"><a href="tel:+918946055856" style="padding:10px 14px;border:1px solid #cbd5e1;border-radius:8px;color:#143f85;text-decoration:none">Call to check availability</a><a href="https://wa.me/918946055856" target="_blank" rel="noopener noreferrer" style="padding:10px 14px;border:1px solid #cbd5e1;border-radius:8px;color:#143f85;text-decoration:none">WhatsApp Cerood</a></div></section>`;
}
html = html.replace(/(<h1[^>]*id=["']prodTitle["'][^>]*>[\s\S]*?<\/h1>)/i, heading => heading + localIntro);
// Keep metadata consistent when the existing location loader hydrates the page.
const hydrationMetadata = JSON.stringify({seo_title:title, seo_description:description}).replace(/</g, '\\u003c');
html = html.replace(/const page\s*=\s*data\.page\s*;/, matched => matched + `\nObject.assign(page, ${hydrationMetadata});`);

// Render the same catalogue-backed service choices before JavaScript runs.
const applianceChoices = require(path.join(process.cwd(), 'cerood-appliance-services.js'));
const applianceChoicesHtml = applianceChoices.html(applianceServices, page, {state, district, location});
if (applianceChoicesHtml) {
    html = html.replace(
        /(<h1[^>]*id=["']prodTitle["'][^>]*>[\s\S]*?<\/h1>)/i,
        heading => heading + `<section id="ceroodApplianceServiceChoices" style="background:#fff;margin:12px 0;padding:12px 0;border-top:1px solid #eee">${applianceChoicesHtml}</section>`
    );
}

const isGasRefill = service === 'ac-gas-refill';
// Restore visible details using the same escaped renderer as client hydration.
if (serviceFamily === 'home') {
 const catalogService = applianceServices.find(item => String(item.service_id) === String(page.service_id)) || {};
 const detailService = {...catalogService, ...page, slug: service};
 const details = require(path.join(process.cwd(), 'cerood-service-details.js')).html(detailService);
 const marker = /(<\/div>\s*<!-- RIGHT : BOOKING PANEL -->)/;
 if (details && marker.test(html)) html = html.replace(marker, () => '<section id="ceroodServiceDetails" aria-label="Service details">' + details + '</section>\n</div>\n<!-- RIGHT : BOOKING PANEL -->');
}

if (isGasRefill) {
 html = html.replace(/<span class="starts-from-label">[\s\S]*?<\/span>/i, '<span class="starts-from-label">Inspection charge</span>');
}

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
                "name": "Cerood",
                "url": "https://www.cerood.com/home-services.html",
                "telephone": "+918946055856"
            },
            "areaServed": {
                "@type": "Place",
                "name": seoLocation
            },
            "serviceType": page.service_name
        },
        {
            "@type": "BreadcrumbList",
            "@id": `${canonical}#breadcrumb`,
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
                    "name": page.district || district,
                    "item": `https://www.cerood.com/${encodePathSegment(state)}/${encodePathSegment(district)}`
                },
                ...(district !== location ? [{
                    "@type": "ListItem", "position": 3,
                    "name": locationName,
                    "item": `https://www.cerood.com/${encodePathSegment(state)}/${encodePathSegment(district)}/location/${encodePathSegment(location)}`
                }] : []),
                {
                    "@type": "ListItem",
                    "position": district === location ? 3 : 4,
                    "name": page.service_name,
                    "item": canonical
                }
            ]
        }
    ]
};

const schemaTag =
    `<script type="application/ld+json" id="ceroodServerSeoSchema">` +
    `${JSON.stringify(serverSchema).replace(/</g, '\\u003c')}` +
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
            'public, max-age=0, s-maxage=60, stale-while-revalidate=0'
        );

        html = html.replace('</head>', '<script src="/contact-events.js" defer></script>\n</head>');

        return res
            .status(200)
            .send(html);

    } catch (error) {

        console.error(
            'SEO product render error:',
            error
        );

        res.setHeader('Retry-After', '60');
        return res.status(503).send('Service page temporarily unavailable. Please try again.');
    }
};
