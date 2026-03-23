// BRAND_DOMAINS kept for reference and future use (e.g. proxied logo fetching).
// getBrandLogoUrl returns null because logo.clearbit.com is blocked by
// Brave Shields and most ad blockers — use BrandInitial in ComparePage instead.
export const BRAND_DOMAINS = {
  nvidia: 'nvidia.com', amd: 'amd.com', intel: 'intel.com',
  corsair: 'corsair.com', 'g.skill': 'gskill.com', gskill: 'gskill.com',
  samsung: 'samsung.com', wd: 'westerndigital.com', seagate: 'seagate.com',
  asus: 'asus.com', msi: 'msi.com', gigabyte: 'gigabyte.com',
  asrock: 'asrock.com', evga: 'evga.com', zotac: 'zotac.com',
  apple: 'apple.com', sony: 'sony.com', lg: 'lg.com',
  logitech: 'logitech.com', razer: 'razer.com', steelseries: 'steelseries.com',
  hyperx: 'hyperx.com', kingston: 'kingston.com', crucial: 'crucial.com',
  seasonic: 'seasonic.com', coolermaster: 'coolermaster.com', nzxt: 'nzxt.com',
  thermaltake: 'thermaltake.com', deepcool: 'deepcool.com',
  lenovo: 'lenovo.com', dell: 'dell.com', hp: 'hp.com', acer: 'acer.com',
  microsoft: 'microsoft.com', qualcomm: 'qualcomm.com', xiaomi: 'xiaomi.com',
  oppo: 'oppo.com', vivo: 'vivo.com', realme: 'realme.com', oneplus: 'oneplus.com',
};

export function getBrandLogoUrl(brand) {
  return null;
}