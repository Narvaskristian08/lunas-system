# Local Dagupan account directory

These are local synthetic accounts using real organization and barangay names. They are not official identities, employee records, or production credentials. `.test` addresses do not deliver email.

Default local password: `LunasLocal2026!`. Override with `DAGUPAN_SEED_PASSWORD` when seeding. Ordinary reruns preserve passwords; `--replace` resets seeded accounts to the configured password.

## Organization coverage

- **Dagupan City Engineering Office**: road, drainage, streetlight.
- **Dagupan Electric Corporation (DECORP)**: electrical.
- **Dagupan City Water District / Pamana Water Dagupan**: water.
- **DPWH - Dagupan National Infrastructure**: road, drainage.

The City Engineering provider uses `utility_provider`; the separate legacy City Engineer and four repair accounts were permanently deleted from the local demo on 2026-10-20. DPWH is an ownership-dependent routing option; the responsible district must be confirmed for each actual asset. Category coverage is a local routing configuration, not a verified maintenance agreement.

Sources: [DECORP](https://decorp.com.ph/), [DCWD/Pamana FAQs](https://dcwd.gov.ph/services/faqs/), [Dagupan drainage coordination](https://www.dagupan.gov.ph/category/press-release/). Barangays come from `lunas_backend/src/data/dagupanBarangays.js`.

The current seed creates 68 accounts: Admin, citizen, 31 barangay officials, 31 Utility Personnel (Tanods) and four agency providers. It never creates repair personnel or the legacy engineer account. Tanod logins are `dagupan.tanod-<barangay-slug>@lunas.test`, using each barangay suffix listed below. Their stored role is `utility_personnel`. All 31 existing Tanods were converted in place on 2026-10-20 with sessions revoked and IDs retained.

## Login identifiers

| Role | Assignment | Email |
| --- | --- | --- |
| admin | Citywide test account | dagupan.admin@lunas.test |
| citizen | Citywide test account | dagupan.citizen@lunas.test |
| barangay_official | Bacayao Norte | dagupan.barangay-bacayao-norte@lunas.test |
| barangay_official | Bacayao Sur | dagupan.barangay-bacayao-sur@lunas.test |
| barangay_official | Barangay II | dagupan.barangay-barangay-ii@lunas.test |
| barangay_official | Barangay IV | dagupan.barangay-barangay-iv@lunas.test |
| barangay_official | Bolosan | dagupan.barangay-bolosan@lunas.test |
| barangay_official | Bonuan Binloc | dagupan.barangay-bonuan-binloc@lunas.test |
| barangay_official | Bonuan Boquig | dagupan.barangay-bonuan-boquig@lunas.test |
| barangay_official | Bonuan Gueset | dagupan.barangay-bonuan-gueset@lunas.test |
| barangay_official | Calmay | dagupan.barangay-calmay@lunas.test |
| barangay_official | Carael | dagupan.barangay-carael@lunas.test |
| barangay_official | Caranglaan | dagupan.barangay-caranglaan@lunas.test |
| barangay_official | Herrero | dagupan.barangay-herrero@lunas.test |
| barangay_official | Lasip Chico | dagupan.barangay-lasip-chico@lunas.test |
| barangay_official | Lasip Grande | dagupan.barangay-lasip-grande@lunas.test |
| barangay_official | Lomboy | dagupan.barangay-lomboy@lunas.test |
| barangay_official | Lucao | dagupan.barangay-lucao@lunas.test |
| barangay_official | Malued | dagupan.barangay-malued@lunas.test |
| barangay_official | Mamalingling | dagupan.barangay-mamalingling@lunas.test |
| barangay_official | Mangin | dagupan.barangay-mangin@lunas.test |
| barangay_official | Mayombo | dagupan.barangay-mayombo@lunas.test |
| barangay_official | Pantal | dagupan.barangay-pantal@lunas.test |
| barangay_official | Poblacion Oeste | dagupan.barangay-poblacion-oeste@lunas.test |
| barangay_official | Barangay I | dagupan.barangay-barangay-i@lunas.test |
| barangay_official | Pogo Chico | dagupan.barangay-pogo-chico@lunas.test |
| barangay_official | Pogo Grande | dagupan.barangay-pogo-grande@lunas.test |
| barangay_official | Pugaro Suit | dagupan.barangay-pugaro-suit@lunas.test |
| barangay_official | Salapingao | dagupan.barangay-salapingao@lunas.test |
| barangay_official | Salisay | dagupan.barangay-salisay@lunas.test |
| barangay_official | Tambac | dagupan.barangay-tambac@lunas.test |
| barangay_official | Tapuac | dagupan.barangay-tapuac@lunas.test |
| barangay_official | Tebeng | dagupan.barangay-tebeng@lunas.test |
| utility_provider | Dagupan City Engineering Office | dagupan.provider-city-maintenance@lunas.test |
| utility_provider | Dagupan Electric Corporation (DECORP) | dagupan.provider-decorp@lunas.test |
| utility_provider | Dagupan City Water District / Pamana Water Dagupan | dagupan.provider-dcwd@lunas.test |
| utility_provider | DPWH - Dagupan National Infrastructure | dagupan.provider-dpwh@lunas.test |
