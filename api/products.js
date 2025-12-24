// /api/products.js
export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // Handle OPTIONS request
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Cache control headers
  res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate');

  try {
    const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
    const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
    const TABLE_NAME = 'Moh7';
    
    if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
      console.error('Missing environment variables');
      return res.status(500).json({
        success: false,
        error: 'Server configuration error'
      });
    }
    
    const airtableUrl = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${TABLE_NAME}?maxRecords=1000`;
    
    const response = await fetch(airtableUrl, {
      headers: {
        'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      next: { revalidate: 60 } // Revalidate every 60 seconds
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Airtable API Error:', response.status, errorText);
      throw new Error(`Airtable error: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Early return if no records
    if (!data.records || data.records.length === 0) {
      return res.status(200).json({
        success: true,
        products: [],
        count: 0,
        message: 'No products found'
      });
    }
    
    const products = [];
    
    for (const record of data.records) {
      const fields = record.fields || {};
      
      // Skip records without a name
      if (!fields['نام'] && !fields['Name'] && !fields['Product Name']) {
        continue;
      }
      
      const product = {
        id: record.id,
        name: fields['نام'] || fields['Name'] || fields['Product Name'] || 'محصول بدون نام',
        code: fields['کود'] || fields['Code'] || fields['Product Code'] || `CODE-${record.id.substring(0, 4)}`,
        description: fields['توضیح'] || fields['Description'] || fields['توضیحات'] || 'بدون توضیح',
        fullDescription: fields['توضیح کامل'] || fields['Full Description'] || fields['توضیحات کامل'] || 
                       fields['توضیح'] || fields['Description'] || fields['توضیحات'] || 'بدون توضیح',
        price: fields['قیمت'] || fields['Price'] || fields['قیمت (افغانی)'] || '0 افغانی',
        stock: parseInt(fields['موجودی'] || fields['Stock'] || fields['تعداد'] || 0),
        category: fields['دسته‌بندی'] || fields['Category'] || fields['دسته'] || 'عمومی',
        images: []
      };
      
      // Process images - optimized version
      const extractImages = (attachments) => {
        if (!attachments) return [];
        if (Array.isArray(attachments)) {
          return attachments
            .filter(att => att && att.url)
            .map(att => att.url);
        }
        return attachments.url ? [attachments.url] : [];
      };
      
      // Check common image field names
      const imageFields = ['تصویر', 'عکس', 'Image', 'Picture', 'Photo'];
      let foundImages = [];
      
      for (const fieldName of imageFields) {
        const fieldValue = fields[fieldName];
        if (fieldValue) {
          const extracted = extractImages(fieldValue);
          foundImages = [...foundImages, ...extracted];
        }
      }
      
      // Also check any field with 'image' in the name
      for (const [key, value] of Object.entries(fields)) {
        if (key.toLowerCase().includes('image') || 
            key.toLowerCase().includes('pic') ||
            (Array.isArray(value) && value[0] && value[0].url)) {
          const extracted = extractImages(value);
          foundImages = [...foundImages, ...extracted];
        }
      }
      
      // Remove duplicates
      product.images = [...new Set(foundImages)];
      
      // If no images, create a placeholder
      if (product.images.length === 0) {
        const emoji = getCategoryPlaceholder(product.category);
        product.images.push(`data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 100 100"><rect width="100" height="100" fill="%23f5f5f5"/><text x="50" y="50" font-size="40" text-anchor="middle" dy=".3em" fill="%23999">${emoji}</text></svg>`);
      }
      
      products.push(product);
    }
    
    res.status(200).json({
      success: true,
      products: products,
      count: products.length,
      lastUpdated: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}

function getCategoryPlaceholder(category) {
  const categoryEmojis = {
    'آرایشی و بهداشتی': '💄',
    'مراقبت مو': '🧴',
    'مراقبت پوست': '🧴',
    'بهداشتی': '🧼',
    'لوازم آرایشی': '💅',
    'عطر': '🌸',
    'کرم': '🧴',
    'شامپو': '🧴',
    'صابون': '🧼',
    'لوازم خانگی': '🏠',
    'لباس': '👕',
    'کفش': '👟',
    'اکسسوری': '👜',
    'لوازم الکترونیکی': '📱',
    'کتاب': '📚',
    'اسباب بازی': '🧸',
    'خوراکی': '🍎',
    'عمومی': '📦'
  };
  return categoryEmojis[category] || '📦';
}