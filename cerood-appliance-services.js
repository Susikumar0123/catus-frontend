(function (root, factory) {
    'use strict';
    const api = factory();
    if (typeof module === 'object' && module.exports) module.exports = api;
    else root.CeroodApplianceServices = api;
})(typeof window !== 'undefined' ? window : globalThis, function () {
    'use strict';
    function escape(value) {
        return String(value || '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
    }
    function family(service) {
        const text = String(service.service_name || '') + ' ' + String(service.slug || '').replace(/-/g, ' ');
        if (/\b(ac|air conditioner|air conditioning)\b/i.test(text)) return 'ac';
        if (/\b(tv|television)\b/i.test(text)) return 'tv';
        if (/\bwashing machine\b/i.test(text)) return 'washing';
        if (/\b(ro|water purifier)\b/i.test(text)) return 'ro';
        if (/\b(chimney)\b/i.test(text)) return 'chimney';
        if (/\b(refrigerator|fridge)\b/i.test(text)) return 'fridge';
        if (/\b(ceiling fan|fan)\b/i.test(text)) return 'fan';
        if (/\b(microwave)\b/i.test(text)) return 'microwave';
        if (/\b(dishwasher)\b/i.test(text)) return 'dishwasher';
        if (/\b(air cooler)\b/i.test(text)) return 'cooler';
        return '';
    }
    function group(service) {
        const name = String(service.service_name || '') + ' ' + String(service.slug || '').replace(/-/g, ' ');
        if (/\b(uninstallation|removal|relocation|reinstallation)\b/i.test(name)) return 'Move or remove';
        if (/\b(installation|install|setup|wall mount)\b/i.test(name)) return 'Install or set up';
        return 'Service or repair';
    }
    function select(services, current) {
        const key = family(current);
        if (!key) return [];
        const seen = new Set();
        return (Array.isArray(services) ? services : []).filter(service => {
            const slug = String(service.slug || '').trim();
            if (family(service) !== key || !service.service_name || !/^[a-z0-9-]+$/.test(slug) || seen.has(slug)) return false;
            seen.add(slug);
            return true;
        });
    }
    function url(service, route) {
        const slug = String(service.slug).trim();
        const parts = [route.state, route.district, route.location];
        if (!route.manualAddress && parts.every(part => /^[a-z0-9-]+$/.test(String(part || '')))) {
            const base = '/' + encodeURIComponent(route.state) + '/' + encodeURIComponent(route.district);
            return base + (route.location === route.district ? '' : '/' + encodeURIComponent(route.location)) + '/' + encodeURIComponent(slug);
        }
        return '/product.html?id=' + encodeURIComponent(slug);
    }
    function html(services, current, route) {
        const items = select(services, current);
        if (items.length < 2) return '';
        const groups = ['Install or set up', 'Service or repair', 'Move or remove'];
        return '<h2 style="font-size:15px;margin:0 0 6px;color:#111">Services for your appliance</h2>' +
            '<p style="font-size:12px;line-height:1.5;margin:0 0 12px;color:#555">Choose the service you need. Each service has its own details and booking.</p>' +
            groups.map(label => {
                const subset = items.filter(item => group(item) === label);
                if (!subset.length) return '';
                return '<div style="margin:0 0 12px"><h3 style="font-size:12px;color:#333;margin:0 0 7px">' + label + '</h3><div style="display:flex;flex-wrap:wrap;gap:8px">' +
                    subset.map(item => {
                        const active = String(item.slug) === String(current.slug) || (item.service_id != null && current.service_id != null && String(item.service_id) === String(current.service_id));
                        return '<a href="' + escape(url(item, route)) + '"' + (active ? ' aria-current="page"' : '') + ' style="display:block;padding:8px 10px;border:1px solid ' + (active ? '#333' : '#ddd') + ';border-radius:5px;color:#111;background:#fff;font-size:12px;line-height:1.4;text-decoration:none;' + (active ? 'font-weight:700;' : '') + '">' + escape(item.service_name) + '</a>';
                    }).join('') + '</div></div>';
            }).join('');
    }
    function render(services, current, route) {
        const heading = document.getElementById('prodTitle');
        if (!heading) return;
        let section = document.getElementById('ceroodApplianceServiceChoices');
        const content = html(services, current, route);
        if (!content) { if (section) section.remove(); return; }
        if (!section) {
            section = document.createElement('section');
            section.id = 'ceroodApplianceServiceChoices';
            section.style.cssText = 'background:#fff;margin:12px 0;padding:12px 0;border-top:1px solid #eee';
            const options = document.getElementById('productVariantArea');
            (options || heading).insertAdjacentElement('afterend', section);
        }
        section.innerHTML = content;
    }
    return {family, group, select, url, html, render};
});
