export type Town = {
  name: string
  region: string
  lat: number
  lng: number
}

export const ghanaTowns: Town[] = [
  // Greater Accra Region
  { name: "Accra", region: "Greater Accra", lat: 5.6037, lng: -0.1870 },
  { name: "Tema", region: "Greater Accra", lat: 5.6690, lng: -0.0166 },
  { name: "Madina", region: "Greater Accra", lat: 5.6730, lng: -0.1660 },
  { name: "Ashaiman", region: "Greater Accra", lat: 5.6990, lng: -0.0360 },
  { name: "Kasoa", region: "Central", lat: 5.5340, lng: -0.4160 },
  { name: "Dzorwulu", region: "Greater Accra", lat: 5.6040, lng: -0.2140 },
  { name: "Osu", region: "Greater Accra", lat: 5.5550, lng: -0.1770 },
  { name: "Labadi", region: "Greater Accra", lat: 5.5660, lng: -0.1580 },
  { name: "Cantonments", region: "Greater Accra", lat: 5.5750, lng: -0.1920 },
  { name: "Airport Residential", region: "Greater Accra", lat: 5.6120, lng: -0.2010 },
  { name: "Spintex", region: "Greater Accra", lat: 5.6340, lng: -0.1470 },
  { name: "Kaneshie", region: "Greater Accra", lat: 5.5620, lng: -0.2340 },
  { name: "Adenta", region: "Greater Accra", lat: 5.6800, lng: -0.1600 },
  { name: "Dodowa", region: "Greater Accra", lat: 5.8830, lng: -0.0830 },
  { name: "Amasaman", region: "Greater Accra", lat: 5.7000, lng: -0.3500 },

  // Ashanti Region
  { name: "Kumasi", region: "Ashanti", lat: 6.6885, lng: -1.6244 },
  { name: "Obuasi", region: "Ashanti", lat: 6.2000, lng: -1.6830 },
  { name: "Mampong", region: "Ashanti", lat: 7.0560, lng: -1.4000 },
  { name: "Ejisu", region: "Ashanti", lat: 6.7200, lng: -1.4660 },
  { name: "Konongo", region: "Ashanti", lat: 6.6170, lng: -1.4170 },
  { name: "Agogo", region: "Ashanti", lat: 6.8000, lng: -1.0830 },
  { name: "Bekwai", region: "Ashanti", lat: 6.4500, lng: -1.5830 },
  { name: "Effiduase", region: "Ashanti", lat: 6.8000, lng: -1.4000 },
  { name: "Asante Mampong", region: "Ashanti", lat: 7.0560, lng: -1.4000 },
  { name: "Juaben", region: "Ashanti", lat: 6.7330, lng: -1.4000 },

  // Central Region
  { name: "Cape Coast", region: "Central", lat: 5.1315, lng: -1.2795 },
  { name: "Winneba", region: "Central", lat: 5.3380, lng: -0.6170 },
  { name: "Swedru", region: "Central", lat: 5.5330, lng: -0.7000 },
  { name: "Mankessim", region: "Central", lat: 5.2830, lng: -0.9830 },
  { name: "Elmina", region: "Central", lat: 5.0830, lng: -1.3500 },
  { name: "Saltpond", region: "Central", lat: 5.2000, lng: -1.0670 },
  { name: "Dunkwa-on-Offin", region: "Central", lat: 5.9670, lng: -1.7830 },
  { name: "Apam", region: "Central", lat: 5.2830, lng: -0.7330 },
  { name: "Assin Fosu", region: "Central", lat: 5.6980, lng: -1.2820 },

  // Western Region
  { name: "Sekondi-Takoradi", region: "Western", lat: 4.9000, lng: -1.7667 },
  { name: "Tarkwa", region: "Western", lat: 5.3000, lng: -1.9830 },
  { name: "Axim", region: "Western", lat: 4.8670, lng: -2.2330 },
  { name: "Half Assini", region: "Western", lat: 5.0500, lng: -2.8830 },
  { name: "Prestea", region: "Western", lat: 5.4330, lng: -2.1500 },
  { name: "Bogoso", region: "Western", lat: 5.5670, lng: -2.0000 },

  // Eastern Region
  { name: "Koforidua", region: "Eastern", lat: 6.0830, lng: -0.2670 },
  { name: "Nkawkaw", region: "Eastern", lat: 6.5500, lng: -0.7670 },
  { name: "Akropong", region: "Eastern", lat: 5.9670, lng: -0.0830 },
  { name: "Akwatia", region: "Eastern", lat: 6.0500, lng: -0.8000 },
  { name: "Aburi", region: "Eastern", lat: 5.8500, lng: -0.1830 },
  { name: "Kibi", region: "Eastern", lat: 6.1670, lng: -0.5500 },
  { name: "Mpraeso", region: "Eastern", lat: 6.5830, lng: -0.7330 },
  { name: "Bunso", region: "Eastern", lat: 6.2830, lng: -0.4670 },

  // Volta Region
  { name: "Ho", region: "Volta", lat: 6.6000, lng: 0.4670 },
  { name: "Hohoe", region: "Volta", lat: 7.1500, lng: 0.4670 },
  { name: "Aflao", region: "Volta", lat: 6.1170, lng: 1.1830 },
  { name: "Keta", region: "Volta", lat: 5.9170, lng: 0.9830 },
  { name: "Kpandu", region: "Volta", lat: 7.0000, lng: 0.2830 },
  { name: "Akatsi", region: "Volta", lat: 6.1170, lng: 0.7170 },
  { name: "Denu", region: "Volta", lat: 6.1000, lng: 1.2500 },
  { name: "Anloga", region: "Volta", lat: 5.8000, lng: 0.9000 },

  // Brong Ahafo Region
  { name: "Sunyani", region: "Brong Ahafo", lat: 7.3330, lng: -2.3260 },
  { name: "Techiman", region: "Brong Ahafo", lat: 7.5830, lng: -1.9330 },
  { name: "Berekum", region: "Brong Ahafo", lat: 7.4500, lng: -2.5830 },
  { name: "Dormaa Ahenkro", region: "Brong Ahafo", lat: 7.2670, lng: -2.8670 },
  { name: "Atebubu", region: "Brong Ahafo", lat: 7.7500, lng: -0.9830 },
  { name: "Kintampo", region: "Brong Ahafo", lat: 8.0500, lng: -1.7170 },
  { name: "Nkoranza", region: "Brong Ahafo", lat: 7.5670, lng: -1.7000 },
  { name: "Wenchi", region: "Brong Ahafo", lat: 7.7330, lng: -2.1000 },

  // Northern Region
  { name: "Tamale", region: "Northern", lat: 9.4075, lng: -0.8533 },
  { name: "Yendi", region: "Northern", lat: 9.4330, lng: -0.0170 },
  { name: "Bimbilla", region: "Northern", lat: 9.0670, lng: -0.1830 },
  { name: "Savelugu", region: "Northern", lat: 9.6170, lng: -0.8330 },
  { name: "Gushegu", region: "Northern", lat: 9.9500, lng: -0.1670 },
  { name: "Karaga", region: "Northern", lat: 9.9330, lng: -0.4330 },
  { name: "Kpandae", region: "Northern", lat: 9.4670, lng: -0.0330 },

  // Upper East Region
  { name: "Bolgatanga", region: "Upper East", lat: 10.7830, lng: -0.8500 },
  { name: "Navrongo", region: "Upper East", lat: 10.8830, lng: -1.0830 },
  { name: "Bawku", region: "Upper East", lat: 11.0500, lng: -0.2330 },
  { name: "Paga", region: "Upper East", lat: 10.9830, lng: -1.1170 },

  // Upper West Region
  { name: "Wa", region: "Upper West", lat: 10.0670, lng: -2.5000 },
  { name: "Lawra", region: "Upper West", lat: 10.6500, lng: -2.8830 },
  { name: "Nandom", region: "Upper West", lat: 10.7500, lng: -2.7500 },
]

export function searchTowns(query: string): Town[] {
  if (!query.trim()) return []
  const lower = query.toLowerCase()
  return ghanaTowns
    .filter(
      (t) =>
        t.name.toLowerCase().includes(lower) ||
        t.region.toLowerCase().includes(lower)
    )
    .slice(0, 10)
}
