// // src/dev-cache-tools.js
// const USER = "Ridit07";
// const CK = `gh_catalog_${USER}`;
// const RK = `gh_readmes_${USER}`;
// const VK = `gh_assets_v_${USER}`;

// if (typeof window !== "undefined") {
//   window.__ghcache = {
//     // Show raw objects as stored in localStorage
//     show() {
//       const cat = localStorage.getItem(CK);
//       const rms = localStorage.getItem(RK);
//       const ver = localStorage.getItem(VK);
//       console.log({
//         [CK]: cat ? JSON.parse(cat) : null,
//         [RK]: rms ? JSON.parse(rms) : null,
//         [VK]: ver ?? null,
//       });
//     },

//     // Clear all portfolio caches
//     clear() {
//       localStorage.removeItem(CK);
//       localStorage.removeItem(RK);
//       localStorage.removeItem(VK);
//       console.log("cleared", { CK, RK, VK });
//     },

//     // Force the catalog TTL to be expired (set timestamp in the past)
//     expireCatalog(hoursAgo = 2) {
//       const raw = localStorage.getItem(CK);
//       if (!raw) return console.warn("No catalog in LS:", CK);
//       const j = JSON.parse(raw);
//       const delta = Math.max(1, Number(hoursAgo)) * 60 * 60 * 1000;
//       j.t = Date.now() - delta;
//       localStorage.setItem(CK, JSON.stringify(j));
//       console.log(`catalog expired by ${hoursAgo}h`, new Date(j.t));
//     },

//     // Force the readmes TTL to be expired
//     expireReadmes(daysAgo = 8) {
//       const raw = localStorage.getItem(RK);
//       if (!raw) return console.warn("No readmes in LS:", RK);
//       const j = JSON.parse(raw);
//       const delta = Math.max(1, Number(daysAgo)) * 24 * 60 * 60 * 1000;
//       j.t = Date.now() - delta;
//       localStorage.setItem(RK, JSON.stringify(j));
//       console.log(`readmes expired by ${daysAgo}d`, new Date(j.t));
//     },

//     // Simulate a new asset version (like your cron/refresh would)
//     bumpVersion() {
//       const v = String(Date.now());
//       localStorage.setItem(VK, v);
//       console.log("bumped asset version to", v);
//     },
//   };
// }

// export {}; // ensure this runs as a module side effect
