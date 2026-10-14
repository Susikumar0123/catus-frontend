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
        return '<style>#ceroodApplianceServiceChoices .cerood-appliance-options{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;align-items:stretch}#ceroodApplianceServiceChoices .cerood-appliance-option{display:flex;align-items:center;justify-content:flex-start;box-sizing:border-box;min-width:0;min-height:42px;padding:9px 10px;border:1px solid #ddd;border-radius:5px;background:#fff;color:#111;font-size:12px;line-height:1.45;overflow-wrap:anywhere;cursor:default} @media(min-width:851px){#ceroodApplianceServiceChoices{display:block;width:100%;box-sizing:border-box;margin:14px 0 0!important;padding:10px 0 0!important;min-width:0}#ceroodApplianceServiceChoices>h2{font-size:13px!important;margin:0 0 10px!important}#ceroodApplianceServiceChoices>.cerood-appliance-group{display:grid;grid-template-columns:90px minmax(0,1fr);gap:8px;align-items:start;margin:0 0 9px!important}#ceroodApplianceServiceChoices h3{font-size:11px!important;line-height:1.4!important;margin:0!important;padding-top:7px}#ceroodApplianceServiceChoices .cerood-appliance-options{display:flex;flex-wrap:wrap;gap:6px;align-items:stretch}#ceroodApplianceServiceChoices .cerood-appliance-option{flex:0 1 auto;max-width:100%;font-size:11px;line-height:1.35;min-height:30px;padding:6px 8px}} @media(max-width:320px){#ceroodApplianceServiceChoices .cerood-appliance-options{grid-template-columns:1fr}}</style>' +
            '<h2 style="font-size:14px;line-height:1.4;margin:0 0 12px;color:#111">Services for your appliance</h2>' +
            groups.map(label => {
                const subset = items.filter(item => group(item) === label);
                if (!subset.length) return '';
                return '<div class="cerood-appliance-group" style="margin:0 0 14px;min-width:0"><h3 style="font-size:12px;line-height:1.4;color:#333;margin:0 0 7px">' + label + '</h3><div class="cerood-appliance-options">' +
                    subset.map(item => '<span class="cerood-appliance-option">' + escape(item.service_name) + '</span>').join('') +
                    '</div></div>';
            }).join('');
    }

    function positionSection() {
        const section = document.getElementById('ceroodApplianceServiceChoices');
        const grid = document.getElementById('productGridMain');
        const info = grid && grid.querySelector('.product-info');
        if (!section || !grid || !info) return;
        if (window.matchMedia('(min-width:851px)').matches) {
            const panel = document.getElementById('ceroodVisitPanel');
            if (panel) panel.appendChild(section);
        } else {
            const options = document.getElementById('productVariantArea');
            const anchor = options && info.contains(options) ? options : document.getElementById('prodTitle');
            if (anchor) anchor.insertAdjacentElement('afterend', section);
        }
    }
    if (typeof window !== 'undefined' && typeof document !== 'undefined') {
        const media = window.matchMedia('(min-width:851px)');
        media.addEventListener('change', positionSection);
        if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', positionSection);
        else positionSection();
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
        positionSection();
    }
    return {family, group, select, url, html, render, positionSection};
});
