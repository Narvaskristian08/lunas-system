const DAGUPAN_CITY = 'Dagupan City';

// Canonical jurisdiction identifiers and names used by incident intake,
// official review, account provisioning, queue scoping, and mobile selection.
// These are the 31 barangays in the Philippine Statistics Authority's PSGC
// listing for Dagupan City (page data dated 31 July 2025). Keep this as the
// single backend source of truth; clients obtain its names from the API.
// Source:
// https://psa.gov.ph/classification/psgc/barangays/0105518000
const DAGUPAN_BARANGAY_RECORDS = Object.freeze([
  ['0105518001', 'Bacayao Norte'],
  ['0105518002', 'Bacayao Sur'],
  ['0105518003', 'Barangay II'],
  ['0105518004', 'Barangay IV'],
  ['0105518006', 'Bolosan'],
  ['0105518007', 'Bonuan Binloc'],
  ['0105518008', 'Bonuan Boquig'],
  ['0105518009', 'Bonuan Gueset'],
  ['0105518010', 'Calmay'],
  ['0105518011', 'Carael'],
  ['0105518012', 'Caranglaan'],
  ['0105518013', 'Herrero'],
  ['0105518014', 'Lasip Chico'],
  ['0105518015', 'Lasip Grande'],
  ['0105518016', 'Lomboy'],
  ['0105518017', 'Lucao'],
  ['0105518018', 'Malued'],
  ['0105518019', 'Mamalingling'],
  ['0105518020', 'Mangin'],
  ['0105518021', 'Mayombo'],
  ['0105518022', 'Pantal'],
  ['0105518023', 'Poblacion Oeste'],
  ['0105518024', 'Barangay I'],
  ['0105518025', 'Pogo Chico'],
  ['0105518026', 'Pogo Grande'],
  ['0105518027', 'Pugaro Suit'],
  ['0105518028', 'Salapingao'],
  ['0105518029', 'Salisay'],
  ['0105518030', 'Tambac'],
  ['0105518031', 'Tapuac'],
  ['0105518032', 'Tebeng']
].map(([psgcCode, name]) => Object.freeze({ psgcCode, name })));

const DAGUPAN_BARANGAYS = Object.freeze(
  DAGUPAN_BARANGAY_RECORDS.map(({ name }) => name)
);

const comparisonKey = (value) => typeof value === 'string'
  ? value.normalize('NFKC').trim().replace(/\s+/g, ' ').toLocaleLowerCase('en')
  : '';

const barangayByKey = new Map(
  DAGUPAN_BARANGAYS.map((barangay) => [comparisonKey(barangay), barangay])
);

const canonicalizeBarangay = (value) => barangayByKey.get(comparisonKey(value)) || null;
const isCanonicalBarangay = (value) => canonicalizeBarangay(value) === value;
const isRecognizedBarangay = (value) => canonicalizeBarangay(value) !== null;

const canonicalizeDagupanCity = (value) => (
  comparisonKey(value == null ? DAGUPAN_CITY : value) === comparisonKey(DAGUPAN_CITY)
    ? DAGUPAN_CITY
    : null
);

module.exports = {
  DAGUPAN_BARANGAY_RECORDS,
  DAGUPAN_BARANGAYS,
  DAGUPAN_CITY,
  canonicalizeBarangay,
  canonicalizeDagupanCity,
  isCanonicalBarangay,
  isRecognizedBarangay
};
