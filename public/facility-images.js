/* Loads the exact image assignments made in Staff area → Page uploads.
   Keep this file at /facility-images.js (inside the Express public directory). */
(() => {
  'use strict';

  const body = document.body;
  const pageTitle = (body?.dataset.facilityPage || '').trim();
  if (!pageTitle) return;

  const normalize = value => String(value || '').trim().toLowerCase();
  const withCacheBuster = url => `${url}${url.includes('?') ? '&' : '?'}v=${Date.now()}`;

  async function loadFacilityImages() {
    try {
      const [facilityResponse, assetsResponse] = await Promise.all([
        fetch('/api/campus/facilities', { cache: 'no-store' }),
        fetch('/api/content-assets?target_type=facility-photo', { cache: 'no-store' })
      ]);

      if (!facilityResponse.ok) throw new Error(`Facilities request failed (${facilityResponse.status})`);
      if (!assetsResponse.ok) throw new Error(`Image assignments request failed (${assetsResponse.status})`);

      const facilities = await facilityResponse.json();
      const assets = await assetsResponse.json();
      if (!Array.isArray(facilities) || !Array.isArray(assets)) {
        throw new Error('The server returned an invalid facilities or images list.');
      }

      const facility = facilities.find(item => normalize(item.title) === normalize(pageTitle));
      if (!facility) {
        console.warn('[facility-images] No facility record matches this page:', pageTitle);
        return;
      }

      const assigned = new Map();
      for (const asset of assets) {
        if (typeof asset.target_key !== 'string' || !asset.url) continue;
        const prefix = `${facility.id}:`;
        if (!asset.target_key.startsWith(prefix)) continue;
        const slot = asset.target_key.slice(prefix.length);
        // Only exact known slot keys are applied to page elements.
        if (slot === 'cover' || slot.startsWith('card:')) assigned.set(slot, asset);
      }

      document.querySelectorAll('img[data-facility-image]').forEach(img => {
        const slot = img.dataset.facilityImage;
        const asset = assigned.get(slot);
        if (!asset) return; // Keep the page's existing fallback image.
        img.src = withCacheBuster(asset.url);
        if (asset.display_title) img.alt = asset.display_title;
        img.dataset.uploadedFacilityImage = 'true';
      });

      // Optional gallery additions: only used on pages that provide this host.
      const gallery = document.querySelector('[data-facility-gallery]');
      if (gallery) {
        const existingKeys = new Set(
          [...document.querySelectorAll('img[data-facility-image]')]
            .map(img => img.dataset.facilityImage)
        );
        const galleryAssets = assets.filter(asset => {
          if (typeof asset.target_key !== 'string' || !asset.url) return false;
          const prefix = `${facility.id}:`;
          if (!asset.target_key.startsWith(prefix)) return false;
          const slot = asset.target_key.slice(prefix.length);
          return slot !== 'cover' && !slot.startsWith('card:');
        });

        galleryAssets.forEach(asset => {
          if (gallery.querySelector(`[data-uploaded-asset-id="${CSS.escape(String(asset.id))}"]`)) return;
          const card = document.createElement('article');
          card.className = 'g-card';
          card.dataset.uploadedAssetId = String(asset.id);

          const img = document.createElement('img');
          img.src = withCacheBuster(asset.url);
          img.alt = asset.display_title || asset.file_name || 'School facility photo';
          img.loading = 'lazy';

          const textWrap = document.createElement('div');
          textWrap.className = 'txt';
          const title = document.createElement('b');
          title.textContent = asset.display_title || asset.file_name || 'School photo';
          textWrap.append(title);
          card.append(img, textWrap);
          gallery.append(card);
        });
      }
    } catch (error) {
      console.error('[facility-images] Could not load assigned images:', error);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadFacilityImages, { once: true });
  } else {
    loadFacilityImages();
  }
})();
