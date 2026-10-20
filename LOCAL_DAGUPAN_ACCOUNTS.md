# Local Dagupan account directory

These are local synthetic accounts using real organization and barangay names. They are not official identities, employee records, or production credentials. `.test` addresses do not deliver email.

Default local password: `LunasLocal2026!`. Override with `DAGUPAN_SEED_PASSWORD` when seeding. Ordinary reruns preserve passwords; `--replace` resets seeded accounts to the configured password.

## Organization coverage

- **Dagupan City Engineering Office**: road, drainage, streetlight.
- **Dagupan Electric Corporation (DECORP)**: electrical.
- **Dagupan City Water District / Pamana Water Dagupan**: water.
- **DPWH - Dagupan National Infrastructure**: road, drainage.

Both City Engineering accounts use `utility_provider` with the same organization scope; the separate City Engineer reviewer role is retired. DPWH is an ownership-dependent routing option; the responsible district must be confirmed for each actual asset. Category coverage is a local routing configuration, not a verified maintenance agreement.

Sources: [DECORP](https://decorp.com.ph/), [DCWD/Pamana FAQs](https://dcwd.gov.ph/services/faqs/), [Dagupan drainage coordination](https://www.dagupan.gov.ph/category/press-release/). Barangays come from `lunas_backend/src/data/dagupanBarangays.js`.

## Login identifiers

Current definitions contain **69 accounts**: one citizen, one administrator, 31 Secretaries, 31 barangay Tanods, and five agency logins (two share City Engineering scope). Tanods currently use the `repair_personnel` API role and their assigned barangay; they are not agency repair-worker fixtures.

For one continuous test, use **Poblacion Oeste** for the citizen report, its Secretary, and its Tanod. Road/drainage/streetlight reports currently route to City Engineering; water routes to DCWD/Pamana and electrical to DECORP in the current local source configuration. These mappings are test configuration, not verified institutional jurisdiction.

| Workspace | Assignment | Email |
| --- | --- | --- |
| Administrator (web) | Local test account | dagupan.admin@lunas.test |
| Agency (web) | Dagupan City Engineering Office | dagupan.engineer@lunas.test |
| Citizen (mobile) | Local test account | dagupan.citizen@lunas.test |
| Secretary (web) | Bacayao Norte | dagupan.barangay-bacayao-norte@lunas.test |
| Secretary (web) | Bacayao Sur | dagupan.barangay-bacayao-sur@lunas.test |
| Secretary (web) | Barangay II | dagupan.barangay-barangay-ii@lunas.test |
| Secretary (web) | Barangay IV | dagupan.barangay-barangay-iv@lunas.test |
| Secretary (web) | Bolosan | dagupan.barangay-bolosan@lunas.test |
| Secretary (web) | Bonuan Binloc | dagupan.barangay-bonuan-binloc@lunas.test |
| Secretary (web) | Bonuan Boquig | dagupan.barangay-bonuan-boquig@lunas.test |
| Secretary (web) | Bonuan Gueset | dagupan.barangay-bonuan-gueset@lunas.test |
| Secretary (web) | Calmay | dagupan.barangay-calmay@lunas.test |
| Secretary (web) | Carael | dagupan.barangay-carael@lunas.test |
| Secretary (web) | Caranglaan | dagupan.barangay-caranglaan@lunas.test |
| Secretary (web) | Herrero | dagupan.barangay-herrero@lunas.test |
| Secretary (web) | Lasip Chico | dagupan.barangay-lasip-chico@lunas.test |
| Secretary (web) | Lasip Grande | dagupan.barangay-lasip-grande@lunas.test |
| Secretary (web) | Lomboy | dagupan.barangay-lomboy@lunas.test |
| Secretary (web) | Lucao | dagupan.barangay-lucao@lunas.test |
| Secretary (web) | Malued | dagupan.barangay-malued@lunas.test |
| Secretary (web) | Mamalingling | dagupan.barangay-mamalingling@lunas.test |
| Secretary (web) | Mangin | dagupan.barangay-mangin@lunas.test |
| Secretary (web) | Mayombo | dagupan.barangay-mayombo@lunas.test |
| Secretary (web) | Pantal | dagupan.barangay-pantal@lunas.test |
| Secretary (web) | Poblacion Oeste | dagupan.barangay-poblacion-oeste@lunas.test |
| Secretary (web) | Barangay I | dagupan.barangay-barangay-i@lunas.test |
| Secretary (web) | Pogo Chico | dagupan.barangay-pogo-chico@lunas.test |
| Secretary (web) | Pogo Grande | dagupan.barangay-pogo-grande@lunas.test |
| Secretary (web) | Pugaro Suit | dagupan.barangay-pugaro-suit@lunas.test |
| Secretary (web) | Salapingao | dagupan.barangay-salapingao@lunas.test |
| Secretary (web) | Salisay | dagupan.barangay-salisay@lunas.test |
| Secretary (web) | Tambac | dagupan.barangay-tambac@lunas.test |
| Secretary (web) | Tapuac | dagupan.barangay-tapuac@lunas.test |
| Secretary (web) | Tebeng | dagupan.barangay-tebeng@lunas.test |
| Tanod (mobile) | Bacayao Norte | dagupan.tanod-bacayao-norte@lunas.test |
| Tanod (mobile) | Bacayao Sur | dagupan.tanod-bacayao-sur@lunas.test |
| Tanod (mobile) | Barangay II | dagupan.tanod-barangay-ii@lunas.test |
| Tanod (mobile) | Barangay IV | dagupan.tanod-barangay-iv@lunas.test |
| Tanod (mobile) | Bolosan | dagupan.tanod-bolosan@lunas.test |
| Tanod (mobile) | Bonuan Binloc | dagupan.tanod-bonuan-binloc@lunas.test |
| Tanod (mobile) | Bonuan Boquig | dagupan.tanod-bonuan-boquig@lunas.test |
| Tanod (mobile) | Bonuan Gueset | dagupan.tanod-bonuan-gueset@lunas.test |
| Tanod (mobile) | Calmay | dagupan.tanod-calmay@lunas.test |
| Tanod (mobile) | Carael | dagupan.tanod-carael@lunas.test |
| Tanod (mobile) | Caranglaan | dagupan.tanod-caranglaan@lunas.test |
| Tanod (mobile) | Herrero | dagupan.tanod-herrero@lunas.test |
| Tanod (mobile) | Lasip Chico | dagupan.tanod-lasip-chico@lunas.test |
| Tanod (mobile) | Lasip Grande | dagupan.tanod-lasip-grande@lunas.test |
| Tanod (mobile) | Lomboy | dagupan.tanod-lomboy@lunas.test |
| Tanod (mobile) | Lucao | dagupan.tanod-lucao@lunas.test |
| Tanod (mobile) | Malued | dagupan.tanod-malued@lunas.test |
| Tanod (mobile) | Mamalingling | dagupan.tanod-mamalingling@lunas.test |
| Tanod (mobile) | Mangin | dagupan.tanod-mangin@lunas.test |
| Tanod (mobile) | Mayombo | dagupan.tanod-mayombo@lunas.test |
| Tanod (mobile) | Pantal | dagupan.tanod-pantal@lunas.test |
| Tanod (mobile) | Poblacion Oeste | dagupan.tanod-poblacion-oeste@lunas.test |
| Tanod (mobile) | Barangay I | dagupan.tanod-barangay-i@lunas.test |
| Tanod (mobile) | Pogo Chico | dagupan.tanod-pogo-chico@lunas.test |
| Tanod (mobile) | Pogo Grande | dagupan.tanod-pogo-grande@lunas.test |
| Tanod (mobile) | Pugaro Suit | dagupan.tanod-pugaro-suit@lunas.test |
| Tanod (mobile) | Salapingao | dagupan.tanod-salapingao@lunas.test |
| Tanod (mobile) | Salisay | dagupan.tanod-salisay@lunas.test |
| Tanod (mobile) | Tambac | dagupan.tanod-tambac@lunas.test |
| Tanod (mobile) | Tapuac | dagupan.tanod-tapuac@lunas.test |
| Tanod (mobile) | Tebeng | dagupan.tanod-tebeng@lunas.test |
| Agency (web) | Dagupan City Engineering Office | dagupan.provider-city-maintenance@lunas.test |
| Agency (web) | Dagupan Electric Corporation (DECORP) | dagupan.provider-decorp@lunas.test |
| Agency (web) | Dagupan City Water District / Pamana Water Dagupan | dagupan.provider-dcwd@lunas.test |
| Agency (web) | DPWH - Dagupan National Infrastructure | dagupan.provider-dpwh@lunas.test |

## Accounts-only seed

```sh
docker compose --env-file .env.local -f docker-compose.yml -f docker-compose.local.yml exec -T -e ALLOW_DEMO_SEED=true -e DEMO_SEED_DOCKER=true backend npm run seed:dagupan -- --accounts-only
```

On 2026-10-20 this created the 69 accounts in Docker `mongodb/lunas_db` without reports, work orders, deletions, or account replacements. All 69 stored passwords, active/verified states, and configured scopes were checked. Nine representative logins/logouts passed against Docker backend, including citizen/Tanod Android and Secretary/admin/agency web requests. The Poblacion Oeste Secretary personnel endpoint returned exactly its matching Tanod. The full incident lifecycle remains untested. These preverified fixtures allow existing-account sign-in; `.test` addresses cannot test registration/recovery email delivery.
