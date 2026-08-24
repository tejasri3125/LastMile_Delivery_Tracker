const { get, all } = require('./db');

/**
 * Detect Zone from Pincode
 * Searches pincodes table, returns zone details or default fallback
 */
async function detectZone(pincode) {
  if (!pincode) return null;
  const cleanPincode = String(pincode).trim();
  
  const record = await get(`
    SELECT p.pincode, p.area_name, z.id as zone_id, z.code as zone_code, z.name as zone_name
    FROM pincodes p
    JOIN zones z ON p.zone_id = z.id
    WHERE p.pincode = ?
  `, [cleanPincode]);

  if (record) {
    return {
      found: true,
      pincode: record.pincode,
      areaName: record.area_name,
      zoneId: record.zone_id,
      zoneCode: record.zone_code,
      zoneName: record.zone_name
    };
  }

  // Fallback heuristic if pincode isn't directly in DB:
  // First digit zone estimation or default zone
  const firstDigit = cleanPincode.charAt(0);
  let fallbackZoneCode = 'ZONE-N';
  if (firstDigit === '4') fallbackZoneCode = 'ZONE-W';
  else if (firstDigit === '5') fallbackZoneCode = 'ZONE-S';
  else if (firstDigit === '7') fallbackZoneCode = 'ZONE-E';

  const defaultZone = await get(`SELECT * FROM zones WHERE code = ?`, [fallbackZoneCode]) 
                    || await get(`SELECT * FROM zones LIMIT 1`);

  return {
    found: false,
    pincode: cleanPincode,
    areaName: `Area (${cleanPincode})`,
    zoneId: defaultZone ? defaultZone.id : 1,
    zoneCode: defaultZone ? defaultZone.code : 'ZONE-N',
    zoneName: defaultZone ? defaultZone.name : 'Default Zone'
  };
}

/**
 * Calculate Order Delivery Charges
 * Full dynamic rate card calculation engine
 */
async function calculateOrderCharge({
  pickupPincode,
  dropPincode,
  lengthCm,
  widthCm,
  heightCm,
  actualWeightKg,
  orderType,  // 'B2B' or 'B2C'
  paymentType // 'Prepaid' or 'COD'
}) {
  // 1. Fetch Volumetric Divisor and COD surcharges from DB config
  const divisorRow = await get(`SELECT value FROM system_config WHERE key = 'volumetric_divisor'`);
  const volumetricDivisor = divisorRow ? parseFloat(divisorRow.value) : 5000;

  const b2bCodRow = await get(`SELECT value FROM system_config WHERE key = 'b2b_cod_surcharge'`);
  const b2cCodRow = await get(`SELECT value FROM system_config WHERE key = 'b2c_cod_surcharge'`);
  
  const b2bCodSurcharge = b2bCodRow ? parseFloat(b2bCodRow.value) : 50;
  const b2cCodSurcharge = b2cCodRow ? parseFloat(b2cCodRow.value) : 25;

  // 2. Zone Detection
  const pickupZoneInfo = await detectZone(pickupPincode);
  const dropZoneInfo = await detectZone(dropPincode);

  const scope = (pickupZoneInfo.zoneId === dropZoneInfo.zoneId) ? 'INTRA_ZONE' : 'INTER_ZONE';

  // 3. Volumetric Weight Calculation: (L x B x H) / Divisor
  const length = parseFloat(lengthCm) || 0;
  const width = parseFloat(widthCm) || 0;
  const height = parseFloat(heightCm) || 0;
  const actualWeight = parseFloat(actualWeightKg) || 0;

  const volumetricWeightKg = parseFloat(((length * width * height) / volumetricDivisor).toFixed(2));
  const billedWeightKg = Math.max(actualWeight, volumetricWeightKg);

  // 4. Rate Card Lookup
  const rateCard = await get(`
    SELECT * FROM rate_cards 
    WHERE order_type = ? AND scope = ?
  `, [orderType, scope]);

  if (!rateCard) {
    throw new Error(`No rate card configured for Order Type: ${orderType}, Scope: ${scope}`);
  }

  const { base_weight_kg, base_rate, per_kg_rate, min_charge } = rateCard;

  // Base Freight Charge Calculation:
  // Base Rate covers weight up to base_weight_kg. Any excess weight is billed at per_kg_rate.
  let freightCharge = base_rate;
  if (billedWeightKg > base_weight_kg) {
    const excessWeight = billedWeightKg - base_weight_kg;
    freightCharge += excessWeight * per_kg_rate;
  }

  freightCharge = Math.max(freightCharge, min_charge);
  freightCharge = parseFloat(freightCharge.toFixed(2));

  // 5. COD Surcharge Calculation
  let codSurcharge = 0;
  if (paymentType === 'COD') {
    codSurcharge = (orderType === 'B2B') ? b2bCodSurcharge : b2cCodSurcharge;
  }

  const totalCharge = parseFloat((freightCharge + codSurcharge).toFixed(2));

  return {
    pickupZone: pickupZoneInfo,
    dropZone: dropZoneInfo,
    scope, // 'INTRA_ZONE' or 'INTER_ZONE'
    dimensions: {
      lengthCm: length,
      widthCm: width,
      heightCm: height,
      volumetricDivisor
    },
    weightBreakdown: {
      actualWeightKg,
      volumetricWeightKg,
      billedWeightKg,
      billedOnVolumetric: volumetricWeightKg > actualWeightKg
    },
    rateCardApplied: {
      orderType,
      scope,
      baseWeightKg: base_weight_kg,
      baseRate: base_rate,
      perKgRate: per_kg_rate,
      minCharge: min_charge
    },
    chargeBreakdown: {
      baseCharge: freightCharge,
      codSurcharge,
      totalCharge
    }
  };
}

module.exports = {
  detectZone,
  calculateOrderCharge
};
