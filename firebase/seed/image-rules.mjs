// Maps a product to Wikimedia Commons search queries and acceptance filters.
// Products use fictional brands, so images can only match the product TYPE (matchLevel: "type").
// First matching rule wins. A candidate is accepted only if its Commons title matches `require`
// and does not match `exclude`. If nothing qualifies the product is flagged for manual review.
//
// To fix a flagged product by hand, add  "<productId>": "File:Exact name.jpg"  to images/overrides.json.

const GENERIC_EXCLUDE =
  /plant|navy|army|soldier|sailor|seabee|marine|chemical|pilot|leachate|fouling|schematic|diagram|figure|fig\.|church|colou?red|streetcar|drinking fountain|flag|logo|map\b|cutaway|zookeys|tablet|bottled|nature's spring/i;

export const RULES = [
  // ---- RO commercial / industrial plants
  { name: 'ro-commercial', test: (p) => /commercial/i.test(p.name),
    queries: ['reverse osmosis system', 'RO plant', 'reverse osmosis water treatment'],
    require: /reverse osmosis|ro plant|ro system/i, exclude: /navy|army|soldier|sailor|chemical|pilot|leachate|fouling|nigeria|bedok|newater|ruangan|sea water|membrane/i },

  // ---- domestic RO / UV / UF purifiers
  { name: 'ro-domestic', test: (p) => p.category === 'RO Water Purifiers',
    queries: ['RO water purifier', 'domestic water purifier', 'home water purifier India', 'Aquaguard', 'Kent RO purifier'],
    require: /purifier|aquaguard|kent|osmosis|water filter/i, exclude: GENERIC_EXCLUDE },
  { name: 'uv-purifier', test: (p) => p.category === 'UV Water Purifiers',
    queries: ['UV water purifier', 'ultraviolet water purifier', 'water purifier India', 'UV water sterilizer'],
    require: /purifier|ultraviolet|uv\b|sterili[sz]er/i, exclude: GENERIC_EXCLUDE },
  { name: 'uf-gravity', test: (p) => p.category === 'UF Water Purifiers',
    queries: ['gravity water filter', 'ceramic water filter', 'water purifier India', 'household water filter'],
    require: /gravity|ceramic|filter|purifier/i, exclude: GENERIC_EXCLUDE },

  // ---- dispensers
  { name: 'dispenser', test: (p) => p.category === 'Water Dispensers',
    queries: ['water dispenser', 'water cooler', 'bottom load water dispenser'],
    require: /dispenser|water cooler/i, exclude: /colou?red|negro|streetcar|error|infused|church|living water|dpla|g\. i\./i, allowShared: 3 },

  // ---- pumps
  { name: 'pump-submersible', test: (p) => /submersible/i.test(p.name),
    queries: ['submersible pump', 'borewell submersible pump'],
    require: /submersible/i, exclude: /navy|damage|geograph|mill|electrical submersible pump\.png|openwell|non clog/i },
  { name: 'pump-monoblock', test: (p) => /monoblock/i.test(p.name),
    queries: ['monoblock pump', 'centrifugal water pump', 'self priming pump'],
    require: /pump/i, exclude: /gas|breathing|vacuum|booster pump station|geograph|navy/i },
  { name: 'pump-ro-booster', test: (p) => /ro booster/i.test(p.name),
    queries: ['RO booster pump', 'diaphragm pump', 'water diaphragm pump'],
    require: /diaphragm|ro booster/i, exclude: /gas|breathing|vacuum|navy/i },
  { name: 'pump-pressure', test: (p) => p.category === 'Water Pumps',
    queries: ['water pressure booster pump', 'domestic water pump', 'booster pump household'],
    require: /pump/i, exclude: /russian|gas|breathing|vacuum|geograph|station|ulvac|navy|regulator/i },

  // ---- membranes
  { name: 'membrane-housing', test: (p) => /housing/i.test(p.name),
    queries: ['membrane housing reverse osmosis', 'RO membrane housing', 'filter housing'],
    require: /housing/i, exclude: GENERIC_EXCLUDE },
  { name: 'ro-membrane', test: (p) => p.category === 'RO Membranes',
    queries: ['reverse osmosis membrane element', 'spiral wound membrane', 'RO membrane'],
    require: /wickelmodul|spiral|membrane element|ro membrane|membrana/i, exclude: /scaled|virgin|fouling|schematic|photobleach|cito|disc tube|fig/i },

  // ---- filters & cartridges
  { name: 'shower-filter', test: (p) => /shower/i.test(p.name),
    queries: ['shower filter', 'shower head filter'], require: /shower/i, exclude: GENERIC_EXCLUDE },
  { name: 'tap-filter', test: (p) => /tap filter/i.test(p.name),
    queries: ['tap water filter', 'faucet water filter', 'faucet mounted filter'], require: /tap|faucet/i, exclude: GENERIC_EXCLUDE },
  { name: 'whole-house', test: (p) => /whole house|sediment filter 20|iron removal|spin down/i.test(p.name),
    queries: ['whole house water filter', 'sediment filter housing', 'water filter housing'],
    require: /filter|housing/i, exclude: GENERIC_EXCLUDE },
  { name: 'cartridge', test: (p) => p.category === 'Replacement Cartridges',
    queries: ['water filter cartridge', 'carbon filter cartridge', 'sediment filter cartridge'],
    require: /cartridge|patrone|filter/i, exclude: GENERIC_EXCLUDE, allowShared: 3 },
  { name: 'water-filter', test: (p) => p.category === 'Water Filters',
    queries: ['water filter', 'household water filter'], require: /filter/i, exclude: GENERIC_EXCLUDE },

  // ---- spares
  { name: 'smps', test: (p) => /smps|adaptor/i.test(p.name),
    queries: ['switch mode power supply', 'AC DC adapter', 'power adapter 24V'], require: /power supply|adapter|adaptor|smps/i, exclude: /circuit diagram|schematic/i },
  { name: 'uv-lamp', test: (p) => /uv lamp/i.test(p.name),
    queries: ['germicidal lamp', 'UV-C lamp', 'ultraviolet lamp'], require: /germicidal|uv-?c|ultraviolet|uv lamp/i, exclude: /spectrum|diagram|plant|skin/i },
  { name: 'solenoid', test: (p) => /solenoid/i.test(p.name),
    queries: ['solenoid valve', 'water solenoid valve'], require: /solenoid/i, exclude: /diagram|schematic|animation|cutaway/i },
  { name: 'float-switch', test: (p) => /float/i.test(p.name),
    queries: ['float switch', 'water level float switch'], require: /float/i, exclude: /diagram|schematic|aircraft|plane/i },
  { name: 'pressure-switch', test: (p) => /pressure switch/i.test(p.name),
    queries: ['pressure switch', 'water pressure switch'], require: /pressure switch/i, exclude: /diagram|schematic|differential/i },
  { name: 'flow-restrictor', test: (p) => /flow restrictor/i.test(p.name),
    queries: ['flow restrictor', 'flow restrictor RO'], require: /restrictor/i, exclude: /diagram|schematic/i },

  // ---- accessories
  { name: 'tubing', test: (p) => /tubing/i.test(p.name),
    queries: ['plastic tubing roll', 'polyethylene tubing', 'tube roll'], require: /tubing|tube/i, exclude: /test tube|blood|fluoro|diagram|vacuum tube/i },
  { name: 'connector', test: (p) => /connector/i.test(p.name),
    queries: ['push-fit fitting', 'push to connect fitting', 'pneumatic fitting'], require: /fitting|connector|push/i, exclude: /electrical|usb|diagram/i },
  { name: 'tds', test: (p) => /tds/i.test(p.name),
    queries: ['TDS meter', 'total dissolved solids meter', 'conductivity meter handheld'], require: /tds|dissolved solids|conductivity/i, exclude: /diagram|chart|graph/i },
  { name: 'tank', test: (p) => /storage tank/i.test(p.name),
    queries: ['stainless steel water tank', 'stainless steel storage tank'], require: /tank/i, exclude: /military|fuel|army|navy|diagram|tanker/i },
  { name: 'bracket', test: (p) => /bracket/i.test(p.name),
    queries: ['wall mount bracket', 'steel wall bracket'], require: /bracket/i, exclude: /diagram|dental|orthodont|shelf support historic/i },
  { name: 'installation-kit', test: (p) => /installation kit/i.test(p.name),
    queries: ['plumbing tools kit'], require: /plumb|kit/i, exclude: GENERIC_EXCLUDE },
];

export const ruleFor = (product) => RULES.find((r) => r.test(product));

// Licences we accept for redistribution inside the app (attribution is always recorded).
// Applied to every rule: historic/government/vehicle/nature photos that merely share a keyword.
export const GLOBAL_EXCLUDE =
  /\bnara\b|windmill|\bfire\b|extinguisher|\bnavy\b|geograph|exfordy|caterham|\briver\b|corrosion|burglar|degassing|recycling|katadyn|\bbottle\b|aircraft|airport|locomotive|railway|\bcars?\b|\bengine\b|\bhotel\b|\bschool\b|museum|portrait|painting|\bstamp\b|cartoon|sketch|\bmap\b|\bwom[ae]n\b|\bman\b|\bgirl\b|\bboy\b|villager|people|unidentified|tubewell|hand pump|\bsteel bars?\b|\bmill\b|youngstown|industries|guitar|taylor|inspection|murphy|gauge|\boil\b/i;

export const ALLOWED_LICENSES = [
  /^cc0/i, /^public domain/i, /^pd\b/i, /^cc[ -]by[ -](\d|sa)/i, /^cc[ -]by$/i, /^cc by-sa/i, /^cc by /i,
];
// Refuse NonCommercial / NoDerivatives even if they match the above prefix.
export const BLOCKED_LICENSES = /-nc|nc-|\bnc\b|-nd|nd-|noncommercial|no derivatives|gfdl only|fair use/i;
