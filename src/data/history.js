export const historyData = [
  {
    id: 1,
    title: 'iPhone 15 Pro Max full specifications',
    time: '10:42 AM',
    date: 'today',
    messages: [
      { role: 'user', content: 'What are the full specs of the iPhone 15 Pro Max?' },
      { role: 'assistant', content: '📱 **iPhone 15 Pro Max Specifications**\n\n**Display:** 6.7" Super Retina XDR OLED, 2796×1290, 120Hz ProMotion\n**Chip:** Apple A17 Pro (3nm) — 6-core CPU, 6-core GPU, 16-core Neural Engine\n**RAM:** 8GB LPDDR5\n**Storage:** 256GB / 512GB / 1TB (NVMe)\n**Rear Camera:**\n• 48MP Main (f/1.78, sensor-shift OIS, 24/28/35mm equiv.)\n• 12MP Ultrawide (f/2.2, 120° FOV)\n• 12MP 5× Telephoto (f/2.8, tetraprism periscope)\n**Front:** 12MP TrueDepth, f/1.9\n**Battery:** 4422mAh, 27W wired, 15W MagSafe\n**OS:** iOS 17 (upgradeable to iOS 18)\n**Body:** Grade 5 Titanium frame, Textured matte glass back\n**Price (PH):** ₱82,990 (256GB) — ₱102,990 (1TB)' },
    ]
  },
  {
    id: 2,
    title: 'Is iPhone 13 still worth buying in 2025?',
    time: '10:38 AM',
    date: 'today',
    messages: [
      { role: 'user', content: 'Is the iPhone 13 still worth buying?' },
      { role: 'assistant', content: '**iPhone 13 in 2025 — Worth it?**\n\nShort answer: **Yes, for budget buyers.** Here\'s why:\n\n✅ **Pros:**\n• A15 Bionic still very capable for daily tasks and gaming\n• iOS 18 support confirmed\n• Excellent camera quality (dual 12MP)\n• 60Hz display (downside vs. competitors)\n• Prices dropped to ~₱32,000–38,000\n\n❌ **Cons:**\n• 60Hz display feels dated in 2025\n• No USB-C (Lightning only)\n• 5G limited to certain carriers\n• No ProMotion / Dynamic Island\n\n**Verdict:** If budget is ₱30-40K, the iPhone 13 is solid. If you can stretch to ₱50K+, consider iPhone 15 for USB-C and 48MP camera.' },
    ]
  },
  {
    id: 3,
    title: 'Snapdragon 888 vs Snapdragon 8 Gen 1',
    time: '10:25 AM',
    date: 'today',
    messages: [
      { role: 'user', content: 'Compare Snapdragon 888 vs Snapdragon 8 Gen 1' },
      { role: 'assistant', content: '**Snapdragon 888 vs 8 Gen 1 Comparison**\n\n| Spec | SD 888 | SD 8 Gen 1 |\n|------|--------|------------|\n| Process | 5nm (Samsung) | 4nm (Samsung) |\n| CPU Prime | Cortex-X1 2.84GHz | Cortex-X2 3.0GHz |\n| GPU | Adreno 660 | Adreno 730 |\n| AI | 26 TOPS | 32 TOPS |\n| 5G | Integrated X60 | Integrated X65 |\n\n**Thermal Issues:** Both chips use Samsung 4/5nm — the 8 Gen 1 ran notoriously hot. Many OEMs (ASUS, Xiaomi) had significant throttling issues.\n\n**Winner:** 8 Gen 1 is ~20% faster on paper but often performs similarly to 888 in sustained loads due to throttling. If buying a phone, skip both and look for SD 8 Gen 2 or 3 devices.' },
    ]
  },
  {
    id: 4,
    title: 'Best phone processor for gaming',
    time: '9:11 PM',
    date: 'yesterday',
    messages: [
      { role: 'user', content: 'What is the best smartphone processor for gaming?' },
      { role: 'assistant', content: '**Best Mobile Processors for Gaming (2024-2025)**\n\n🥇 **Snapdragon 8 Gen 3** (Qualcomm)\n• Found in: Samsung S24 Ultra, Xiaomi 14 Ultra, ASUS ROG Phone 8\n• Best sustained performance, best GPU\n\n🥈 **Apple A17 Pro**\n• Found in: iPhone 15 Pro / Pro Max\n• Best single-core, excellent GPU for iOS gaming\n\n🥉 **Dimensity 9300** (MediaTek)\n• Found in: Vivo X100 Pro, OnePlus 12\n• Surprisingly capable, competitive price\n\n**For pure gaming on Android:** Snapdragon 8 Gen 3 + good cooling = best experience. ASUS ROG Phone 8 Pro leads in this category with 165Hz display and AeroActive cooler.' },
    ]
  },
  {
    id: 5,
    title: 'Lenovo G480 maximum RAM support',
    time: '8:47 PM',
    date: 'yesterday',
    messages: [
      { role: 'user', content: 'How much maximum RAM can I put in a Lenovo G480?' },
      { role: 'assistant', content: 'The **Lenovo G480** can support up to **8GB of RAM** officially, though some users report 16GB working.\n\n**RAM Specs:**\n• Type: DDR3 1333/1600MHz\n• Slots: 2x SO-DIMM\n• Official max: 8GB (2×4GB)\n• Reported max: 16GB (2×8GB DDR3L)\n\n⚠️ **Note:** This laptop is quite old (2012-era, Sandy/Ivy Bridge CPU). Even maxing the RAM won\'t significantly improve performance for modern tasks. The bottleneck is the aging processor and HDD (if not yet upgraded to SSD).\n\n**Better upgrades to consider:**\n1. Install an SSD (biggest speed boost)\n2. Max out RAM to 8GB\n3. Fresh Windows/Linux install' },
    ]
  },
  {
    id: 6,
    title: 'Can 8GB RAM handle Android Studio?',
    time: '8:30 PM',
    date: 'yesterday',
    messages: [
      { role: 'user', content: 'Can 8GB RAM handle Android Studio?' },
      { role: 'assistant', content: '**8GB RAM for Android Studio — Doable but tight.**\n\n**Minimum requirements:** 8GB RAM (Google officially recommends 16GB)\n\n**Reality with 8GB:**\n• Android Studio itself: ~2-3GB\n• Android Emulator: 2-4GB (huge impact!)\n• OS + background: 2-3GB\n• **Result:** Constant swapping, slow builds\n\n**Tips to survive on 8GB:**\n1. Use a physical device instead of emulator\n2. Close Chrome and other heavy apps\n3. Set Gradle JVM heap to 2GB max\n4. Enable "Power save mode" in Android Studio\n\n**Recommendation:** Upgrade to 16GB if possible. DDR4 16GB kits are affordable now (~₱2,500-3,500).' },
    ]
  },
  {
    id: 7,
    title: 'Laptop requirements for programming students',
    time: '6:02 PM',
    date: 'last7days',
    messages: [
      { role: 'user', content: 'What laptop specs do I need as a programming student?' },
      { role: 'assistant', content: '**Laptop Specs for Programming Students**\n\n**Minimum (budget ₱25K-35K):**\n• CPU: Intel Core i5 12th/13th gen or Ryzen 5 5000 series\n• RAM: 16GB DDR4\n• Storage: 512GB SSD\n• Display: 1080p IPS\n\n**Recommended (₱45K-65K):**\n• CPU: Intel Core i7 13th gen or Ryzen 7 7000 series\n• RAM: 16GB (upgradeable to 32GB)\n• Storage: 512GB NVMe SSD\n• Display: 1080p/1440p IPS, 120Hz+\n\n**Top Picks:**\n1. **Acer Aspire 5** — ₱28K-35K (budget king)\n2. **ASUS VivoBook 15** — ₱32K-42K\n3. **Lenovo IdeaPad 5 Pro** — ₱45K-55K\n4. **MacBook Air M2** — ₱68K (best battery + performance for web/mobile dev)\n\n**Don\'t neglect:** Good display (eyes!), keyboard quality, and battery life.' },
    ]
  },
  {
    id: 8,
    title: 'Phone with good camera under ₱20,000',
    time: '5:40 PM',
    date: 'last7days',
    messages: [
      { role: 'user', content: 'Best phone with good camera under ₱20,000?' },
      { role: 'assistant', content: '**Best Camera Phones Under ₱20,000 (Philippines)**\n\n🥇 **Redmi Note 13 Pro** — ₱14,999-16,999\n• 200MP main camera, OIS\n• 6.67" 120Hz AMOLED\n• Dimensity 7200 Ultra\n\n🥈 **Samsung Galaxy A55** — ₱17,990-19,990\n• 50MP OIS main + 12MP ultrawide\n• IP67 water resistant\n• 5 years OS support\n\n🥉 **POCO X6 Pro** — ₱16,999-18,999\n• 64MP main camera\n• Dimensity 8300-Ultra (fastest in range)\n• Great for gaming + camera combo\n\n**Honorable mention: Realme 12 Pro+** — ₱18,999\n• Sony IMX890 50MP OIS\n• 64MP periscope telephoto\n• Best camera versatility in budget range' },
    ]
  },
  {
    id: 9,
    title: 'OLED vs AMOLED display differences',
    time: '4:15 PM',
    date: 'last7days',
    messages: [
      { role: 'user', content: 'What is the difference between OLED and AMOLED?' },
      { role: 'assistant', content: '**OLED vs AMOLED — What\'s the Difference?**\n\n**OLED (Organic Light-Emitting Diode)**\n• Each pixel emits its own light (no backlight needed)\n• Perfect blacks, infinite contrast\n• Used in: TVs, high-end monitors, some phones\n\n**AMOLED (Active Matrix OLED)**\n• AMOLED IS a type of OLED\n• Uses an "active matrix" TFT backplane\n• Faster pixel response, lower power consumption\n• Better for smartphones (more power efficient)\n\n**Key Differences:**\n| Feature | OLED | AMOLED |\n|---------|------|--------|\n| Usage | TVs, monitors | Smartphones |\n| Power | Higher | Lower |\n| Refresh | Standard | Up to 165Hz+ |\n| Touch response | Standard | Faster |\n\n**Bottom line:** AMOLED is a refined version of OLED optimized for mobile. When buying a phone, AMOLED > LCD always.' },
    ]
  },
];

export const getHistoryByDate = () => {
  const today = historyData.filter(h => h.date === 'today');
  const yesterday = historyData.filter(h => h.date === 'yesterday');
  const last7 = historyData.filter(h => h.date === 'last7days');
  return { today, yesterday, last7 };
};