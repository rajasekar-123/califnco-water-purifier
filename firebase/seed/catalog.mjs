// Product catalogue source of truth. Brands are fictional/generic "Califnco" lines plus
// common industry-style naming, so no real trademarked SKUs/prices are claimed.
// Row: [name, brand, category, retailPrice, dealerPrice, stock, rating, specs, blurb]

const R = 'RO Water Purifiers';
const U = 'UV Water Purifiers';
const F = 'UF Water Purifiers';
const D = 'Water Dispensers';
const P = 'Water Pumps';
const M = 'RO Membranes';
const W = 'Water Filters';
const C = 'Replacement Cartridges';
const S = 'Spare Parts';
const A = 'Accessories';

const rows = [
  // RO purifiers
  ['AquaPure Elite RO+UV+TDS 9L', 'AquaPure', R, 15000, 11000, 24, 4.6, { Capacity: '9 L', Technology: 'RO + UV + TDS', Flow: '15 L/h', Power: '60 W', Warranty: '1 year' }, 'Wall-mounted 7-stage purifier with TDS controller for borewell and municipal water.'],
  ['AquaPure Crystal RO 8L', 'AquaPure', R, 12500, 9200, 30, 4.4, { Capacity: '8 L', Technology: 'RO + UV', Flow: '14 L/h', Power: '50 W', Warranty: '1 year' }, 'Compact RO + UV purifier with mineral retention.'],
  ['PureFlow Smart RO+UV 10L', 'PureFlow', R, 18500, 13800, 15, 4.7, { Capacity: '10 L', Technology: 'RO + UV + UF', Flow: '20 L/h', Power: '75 W', Warranty: '2 years' }, 'Smart purifier with filter-life LED indicators and auto flush.'],
  ['PureFlow Essential RO 7L', 'PureFlow', R, 9800, 7200, 42, 4.2, { Capacity: '7 L', Technology: 'RO', Flow: '12 L/h', Power: '40 W', Warranty: '1 year' }, 'Entry level RO purifier for low-TDS municipal supply.'],
  ['HydroMax Under-Sink RO 12L', 'HydroMax', R, 21000, 15500, 10, 4.5, { Capacity: '12 L', Technology: 'RO + UV + Alkaline', Flow: '25 L/h', Power: '80 W', Warranty: '2 years' }, 'Under-sink installation keeps the countertop clear.'],
  ['HydroMax Alkaline RO 9L', 'HydroMax', R, 16200, 11900, 18, 4.5, { Capacity: '9 L', Technology: 'RO + Alkaline', Flow: '16 L/h', Power: '60 W', Warranty: '1 year' }, 'Adds alkaline minerals for balanced pH water.'],
  ['ClearWave Copper RO 8L', 'ClearWave', R, 14200, 10400, 20, 4.3, { Capacity: '8 L', Technology: 'RO + Copper + UV', Flow: '15 L/h', Power: '55 W', Warranty: '1 year' }, 'Copper infusion stage for traditional copper-charged water.'],
  ['ClearWave Family RO 15L', 'ClearWave', R, 23500, 17300, 8, 4.6, { Capacity: '15 L', Technology: 'RO + UV + UF', Flow: '30 L/h', Power: '90 W', Warranty: '2 years' }, 'High-capacity purifier for large families and small offices.'],
  ['Califnco Aura RO+UV 7L', 'Califnco', R, 11200, 8200, 36, 4.3, { Capacity: '7 L', Technology: 'RO + UV', Flow: '13 L/h', Power: '48 W', Warranty: '1 year' }, 'Slim wall-mount design with auto shut-off.'],
  ['Califnco Titan Commercial RO 25 LPH', 'Califnco', R, 32500, 24000, 6, 4.4, { Capacity: '25 L/h output', Technology: 'RO + UV', Tank: '40 L', Power: '120 W', Warranty: '1 year' }, 'Commercial RO plant for shops, clinics and small offices.'],
  // UV
  ['AquaPure UV Guard 8L', 'AquaPure', U, 6800, 5000, 40, 4.1, { Capacity: '8 L', Technology: 'UV', Flow: '20 L/h', Power: '30 W', Warranty: '1 year' }, 'UV disinfection purifier for low-TDS clean water supply.'],
  ['PureFlow UV+UF Smart 7L', 'PureFlow', U, 7500, 5500, 33, 4.2, { Capacity: '7 L', Technology: 'UV + UF', Flow: '18 L/h', Power: '30 W', Warranty: '1 year' }, 'Chemical-free purification with UF pre-filter.'],
  ['HydroMax UV Plus 10L', 'HydroMax', U, 8900, 6500, 22, 4.3, { Capacity: '10 L', Technology: 'UV + Carbon', Flow: '22 L/h', Power: '35 W', Warranty: '1 year' }, 'Carbon block plus UV chamber for chlorine and odour removal.'],
  ['ClearWave UV Pro 6L', 'ClearWave', U, 5900, 4300, 45, 4.0, { Capacity: '6 L', Technology: 'UV', Flow: '15 L/h', Power: '25 W', Warranty: '1 year' }, 'Compact UV purifier for apartments.'],
  ['Califnco Shield UV 9L', 'Califnco', U, 7200, 5300, 28, 4.2, { Capacity: '9 L', Technology: 'UV + Sediment', Flow: '20 L/h', Power: '32 W', Warranty: '1 year' }, 'UV purifier with sediment and carbon pre-filters.'],
  // UF
  ['AquaPure Gravity UF 10L', 'AquaPure', F, 2800, 2050, 60, 4.0, { Capacity: '10 L', Technology: 'UF gravity', Power: 'None', Warranty: '1 year' }, 'Non-electric gravity UF purifier for areas with power cuts.'],
  ['PureFlow UF Storage 12L', 'PureFlow', F, 3600, 2600, 38, 4.1, { Capacity: '12 L', Technology: 'UF', Power: 'None', Warranty: '1 year' }, 'Large-capacity gravity purifier with stainless tap.'],
  ['HydroMax UF Inline 8L', 'HydroMax', F, 4800, 3500, 25, 4.2, { Capacity: '8 L', Technology: 'UF + Carbon', Flow: '12 L/h', Power: '20 W', Warranty: '1 year' }, 'Electric UF purifier with carbon polishing.'],
  ['ClearWave UF Basic 9L', 'ClearWave', F, 3100, 2250, 50, 3.9, { Capacity: '9 L', Technology: 'UF', Power: 'None', Warranty: '1 year' }, 'Budget UF purifier for clean municipal supply.'],
  ['Califnco Nova UF 10L', 'Califnco', F, 3950, 2900, 34, 4.1, { Capacity: '10 L', Technology: 'UF + Silver', Power: 'None', Warranty: '1 year' }, 'Silver-impregnated UF candle for extra protection.'],
  // Dispensers
  ['AquaPure Hot & Cold Dispenser', 'AquaPure', D, 11500, 8400, 14, 4.4, { Type: 'Floor standing', Temperature: 'Hot / Normal / Cold', Cooling: 'Compressor', Capacity: '20 L bottle' }, 'Three-temperature bottled water dispenser with child lock.'],
  ['PureFlow Table-Top Dispenser', 'PureFlow', D, 6200, 4500, 21, 4.1, { Type: 'Table top', Temperature: 'Hot / Cold', Cooling: 'Electronic', Capacity: '20 L bottle' }, 'Compact hot and cold dispenser for desks and kitchenettes.'],
  ['HydroMax Bottom-Load Dispenser', 'HydroMax', D, 14800, 10900, 9, 4.5, { Type: 'Floor standing', Temperature: 'Hot / Normal / Cold', Loading: 'Bottom', Capacity: '20 L bottle' }, 'Bottom-loading design makes bottle changes effortless.'],
  ['Califnco Office Cooler 40L', 'Califnco', D, 17500, 12800, 7, 4.3, { Type: 'Water cooler', Storage: '40 L cold', Cooling: 'Compressor', Taps: '2' }, 'Stainless steel water cooler for offices.'],
  ['ClearWave Pedestal Dispenser', 'ClearWave', D, 9400, 6900, 16, 4.2, { Type: 'Floor standing', Temperature: 'Hot / Cold', Cooling: 'Compressor', Capacity: '20 L bottle' }, 'Cabinet-style dispenser with storage compartment.'],
  // Pumps
  ['AquaPure Booster Pump 0.5 HP', 'AquaPure', P, 5200, 3800, 18, 4.3, { Power: '0.5 HP', Head: '30 m', Flow: '35 L/min', Type: 'Booster' }, 'Pressure booster pump for overhead tank and RO feed.'],
  ['PureFlow Monoblock Pump 1 HP', 'PureFlow', P, 6900, 5000, 14, 4.4, { Power: '1 HP', Head: '40 m', Flow: '60 L/min', Type: 'Monoblock' }, 'Self-priming monoblock pump for domestic use.'],
  ['HydroMax Submersible 1.5 HP', 'HydroMax', P, 11800, 8600, 9, 4.5, { Power: '1.5 HP', Head: '60 m', Flow: '80 L/min', Type: 'Submersible' }, 'Borewell submersible pump set with starter.'],
  ['RO Booster Pump 24V 100 GPD', 'Califnco', P, 1450, 1000, 70, 4.2, { Voltage: '24 V DC', Capacity: '100 GPD', Pressure: '100 psi', Type: 'Diaphragm' }, 'Replacement diaphragm booster pump for RO purifiers.'],
  ['ClearWave Pressure Pump 0.25 HP', 'ClearWave', P, 3900, 2850, 20, 4.1, { Power: '0.25 HP', Head: '20 m', Flow: '25 L/min', Type: 'Booster' }, 'Silent booster pump for shower and tap pressure.'],
  // Membranes
  ['RO Membrane 75 GPD', 'Califnco', M, 1250, 880, 90, 4.4, { Capacity: '75 GPD', Size: '1812', Rejection: '96%', Type: 'TFC' }, 'Thin-film composite RO membrane for domestic purifiers.'],
  ['RO Membrane 100 GPD', 'Califnco', M, 1450, 1020, 85, 4.4, { Capacity: '100 GPD', Size: '1812', Rejection: '96%', Type: 'TFC' }, 'Higher flow 100 GPD membrane.'],
  ['RO Membrane 150 GPD', 'AquaPure', M, 1850, 1300, 60, 4.5, { Capacity: '150 GPD', Size: '2012', Rejection: '97%', Type: 'TFC' }, 'High-flow membrane for high-capacity RO systems.'],
  ['RO Membrane 4040 Commercial', 'HydroMax', M, 9800, 7200, 12, 4.6, { Size: '4040', Flow: '2000 GPD', Rejection: '98%', Type: 'Commercial' }, 'Industrial 4040 membrane for commercial plants.'],
  ['RO Membrane Housing 1812', 'PureFlow', M, 650, 450, 55, 4.2, { Size: '1812', Material: 'Food-grade PP', Fitting: '1/4 in' }, 'Replacement membrane housing with end caps.'],
  // Water filters
  ['Whole House Sediment Filter 20"', 'AquaPure', W, 4200, 3050, 26, 4.3, { Size: '20 in', Micron: '5', Connection: '1 in', Use: 'Whole house' }, 'Big-blue style sediment filter for the main inlet line.'],
  ['Shower Filter Vitamin C', 'ClearWave', W, 1650, 1180, 48, 4.1, { Type: 'Shower', Media: 'Vitamin C + KDF', Fitting: 'Universal', Life: '3 months' }, 'Removes chlorine at the showerhead.'],
  ['Inline Carbon Tap Filter', 'PureFlow', W, 850, 600, 80, 4.0, { Type: 'Tap', Media: 'Activated carbon', Fitting: '1/2 in', Life: '2 months' }, 'Simple carbon tap filter for kitchen sinks.'],
  ['Iron Removal Filter 10"', 'HydroMax', W, 3300, 2400, 17, 4.2, { Size: '10 in', Media: 'Birm + Zeolite', Use: 'Borewell iron' }, 'Reduces iron and rust stains from borewell water.'],
  ['Pre-Filter Spin Down 1"', 'Califnco', W, 1900, 1380, 31, 4.2, { Connection: '1 in', Mesh: '100 micron', Flush: 'Manual', Use: 'Pre-filter' }, 'Reusable spin-down sediment pre-filter.'],
  // Cartridges
  ['Sediment Cartridge 10" 5 Micron', 'Califnco', C, 220, 150, 200, 4.3, { Size: '10 in', Micron: '5', Material: 'PP spun' }, 'Stage 1 sediment cartridge.'],
  ['Carbon Block Cartridge 10"', 'Califnco', C, 340, 240, 180, 4.4, { Size: '10 in', Type: 'CTO carbon block', Life: '6 months' }, 'Removes chlorine, taste and odour.'],
  ['Post Carbon Inline Filter', 'AquaPure', C, 180, 120, 220, 4.2, { Size: 'Inline 2 in', Media: 'Coconut carbon' }, 'Final polishing inline filter.'],
  ['UF Membrane Cartridge', 'PureFlow', C, 780, 560, 70, 4.3, { Type: 'Hollow fibre UF', Pore: '0.01 micron', Life: '12 months' }, 'Replacement UF membrane for UF/UV purifiers.'],
  ['Mineral Cartridge Alkaline', 'HydroMax', C, 540, 380, 90, 4.4, { Type: 'Alkaline mineral', Effect: 'pH 8-9', Life: '6 months' }, 'Adds minerals back to RO water.'],
  ['Copper Infusion Cartridge', 'ClearWave', C, 620, 440, 66, 4.2, { Type: 'Copper', Life: '6 months' }, 'Copper charging cartridge.'],
  ['Annual Cartridge Combo Kit', 'AquaPure', C, 1450, 1050, 40, 4.6, { Includes: 'Sediment, Carbon, Post-carbon', Fits: 'Most 7-stage RO' }, 'Annual replacement kit for 7-stage purifiers.'],
  // Spare parts
  ['SMPS Adaptor 24V 1.5A', 'Califnco', S, 540, 380, 100, 4.1, { Input: '100-240 V AC', Output: '24 V DC 1.5 A' }, 'Power supply for RO purifiers.'],
  ['UV Lamp 11W with Chamber', 'Califnco', S, 690, 490, 75, 4.2, { Power: '11 W', Length: '212 mm', Life: '9000 h' }, 'UV lamp and quartz sleeve set.'],
  ['Solenoid Valve 24V', 'Califnco', S, 380, 270, 110, 4.2, { Voltage: '24 V DC', Thread: '1/4 in' }, 'Inlet solenoid valve.'],
  ['Flow Restrictor 300 ml', 'Califnco', S, 95, 60, 250, 4.0, { Rate: '300 ml/min', Fitting: '1/4 in' }, 'Drain flow restrictor.'],
  ['Float Switch / Tank Sensor', 'AquaPure', S, 260, 180, 120, 4.1, { Type: 'Magnetic float', Fitting: '1/4 in' }, 'Tank full sensor.'],
  ['Pressure Switch High-Low', 'PureFlow', S, 310, 220, 95, 4.1, { Type: 'High/Low', Range: '30-50 psi' }, 'High-low pressure switch.'],
  // Accessories
  ['1/4" Tubing Roll 10 m', 'Califnco', A, 320, 220, 140, 4.3, { Length: '10 m', Size: '1/4 in', Material: 'Food-grade LLDPE' }, 'Food-grade RO tubing.'],
  ['Push-Fit Connector Set (20 pcs)', 'Califnco', A, 480, 340, 130, 4.2, { Pieces: '20', Size: '1/4 in' }, 'Assorted elbows, tees and straight connectors.'],
  ['Purifier Installation Kit', 'AquaPure', A, 760, 540, 60, 4.4, { Includes: 'Tubing, tap adapter, clamps, tape' }, 'Everything needed to install a wall-mount purifier.'],
  ['TDS Meter Digital', 'PureFlow', A, 450, 310, 160, 4.5, { Range: '0-9990 ppm', Accuracy: '±2%' }, 'Handheld digital TDS tester.'],
  ['Stainless Steel Storage Tank 20 L', 'HydroMax', A, 2200, 1600, 24, 4.3, { Capacity: '20 L', Material: 'SS 304' }, 'Food-grade stainless steel storage tank.'],
  ['Purifier Wall Mount Bracket', 'Califnco', A, 290, 200, 90, 4.0, { Material: 'Powder-coated steel', Load: '25 kg' }, 'Heavy-duty bracket for wall-mount purifiers.'],
];

export const slugify = (s) =>
  s.toLowerCase().replace(/["']/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

// Representative photo per category. Replace with real product shots by placing
// firebase/seed/images/<product-id>.jpg and running `npm run seed -- --upload-images`.
export const CATEGORY_IMAGES = {};

export const products = rows.map(([name, brand, category, price, dealerPrice, stock, rating, specs, description], i) => ({
  id: `P${String(i + 1).padStart(3, '0')}-${slugify(name).slice(0, 40)}`,
  name, brand, category, description, price, dealerPrice, stock, rating,
  ratingCount: 40 + ((i * 37) % 460),
  specs, image: '', active: true,
  minQty: category === C || category === S || category === A ? 10 : 2,
}));
