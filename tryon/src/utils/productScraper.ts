import puppeteer, { Browser, Page } from 'puppeteer';
import * as cheerio from 'cheerio';

/**
 * Interface defining the structure of scraped product data
 */
export interface ProductData {
  url: string;
  title: string;
  description: string;
  imageUrls: string[];
  website: string;
  scrapedAt: Date;
}

/**
 * Interface for website-specific scraping configurations
 */
interface WebsiteConfig {
  name: string;
  imageSelectors: string[];
  titleSelectors: string[];
  descriptionSelectors: string[];
  maxImages: number;
}

/**
 * Configuration for different e-commerce websites
 * Extensible for future website support
 */
const WEBSITE_CONFIGS: { [key: string]: WebsiteConfig } = {
  'amazon.com': {
    name: 'Amazon',
    imageSelectors: [
      // Main product image
      '#landingImage',
      // Alternative main image selectors
      '.a-dynamic-image',
      '#imgTagWrapperId img',
      // Thumbnail images that often contain high-res versions
      '.a-button-thumbnail img',
      '.imageThumb img',
      // Image gallery selectors
      '#altImages img',
      '.a-spacing-small.item img',
      // Fallback selectors
      '.a-image-wrapper img',
      'img[data-old-hires]',
      'img[src*="images-amazon"]'
    ],
    titleSelectors: [
      '#productTitle',
      '.product-title',
      'h1.a-size-large',
      'h1[data-automation-id="product-title"]',
      '.a-size-large.product-title-word-break'
    ],
    descriptionSelectors: [
      // Feature bullets
      '#feature-bullets ul li span.a-list-item:not(.a-color-secondary)',
      '#feature-bullets .a-unordered-list li span:not(.a-text-bold)',
      // Product description
      '#productDescription p',
      // About this item
      '#feature-bullets .a-spacing-medium .a-list-item',
      // Fallback
      '.a-unordered-list .a-list-item:first-child'
    ],
    maxImages: 2
  }
  // Future website configurations can be added here
  // 'zalando.com': { ... },
  // 'h&m.com': { ... }
};

/**
 * Determines which website configuration to use based on the URL
 * @param url - The product page URL to analyze
 * @returns The website configuration key or null if not supported
 */
function getWebsiteFromUrl(url: string): string | null {
  console.log(`🔍 Analyzing URL: ${url}`);
  
  try {
    const domain = new URL(url).hostname.toLowerCase();
    
    // Check for Amazon domains (including international versions)
    if (domain.includes('amazon.')) {
      console.log(`✅ Detected Amazon website: ${domain}`);
      return 'amazon.com';
    }
    
    // Future website detection can be added here
    
    console.log(`❌ Unsupported website: ${domain}`);
    return null;
  } catch (error) {
    console.error(`❌ Invalid URL format: ${error}`);
    return null;
  }
}

/**
 * Extracts text content from multiple possible selectors
 * @param $ - Cheerio instance for HTML parsing
 * @param selectors - Array of CSS selectors to try
 * @returns The first found text content or empty string
 */
function extractTextFromSelectors($: cheerio.CheerioAPI, selectors: string[]): string {
  for (const selector of selectors) {
    const element = $(selector).first();
    if (element.length > 0) {
      const text = element.text().trim();
      if (text) {
        console.log(`✅ Found text with selector '${selector}': ${text.substring(0, 100)}...`);
        return text;
      }
    }
  }
  console.log(`⚠️ No text found with any of the selectors: ${selectors.join(', ')}`);
  return '';
}

/**
 * Extracts image URLs from multiple possible selectors
 * @param $ - Cheerio instance for HTML parsing
 * @param selectors - Array of CSS selectors to try
 * @param maxImages - Maximum number of images to extract
 * @returns Array of image URLs
 */
function extractImageUrls($: cheerio.CheerioAPI, selectors: string[], maxImages: number): string[] {
  const imageUrls: Set<string> = new Set(); // Use Set to avoid duplicates
  
  for (const selector of selectors) {
    if (imageUrls.size >= maxImages) break;
    
    const elements = $(selector);
    console.log(`🖼️ Found ${elements.length} elements with selector '${selector}'`);
    
    elements.each((_, element) => {
      if (imageUrls.size >= maxImages) return false; // Break the loop
      
      const $element = $(element);
      
      // Try multiple image URL attributes in order of preference
      let imageUrl = 
        $element.attr('data-old-hires') ||    // High-res version (Amazon specific)
        $element.attr('data-a-hires') ||      // High-res version (Amazon specific)
        $element.attr('data-src') ||          // Lazy loaded images
        $element.attr('src') ||               // Standard src
        $element.attr('data-lazy-src') ||     // Another lazy loading pattern
        $element.attr('data-original');       // Original image
      
      if (imageUrl) {
        // Clean and normalize the URL
        imageUrl = cleanImageUrl(imageUrl);
        
        // Validate the URL
        if (isValidImageUrl(imageUrl)) {
          console.log(`✅ Found valid image URL: ${imageUrl}`);
          imageUrls.add(imageUrl);
        }
      }
    });
  }
  
  const finalUrls = Array.from(imageUrls);
  console.log(`📸 Total unique images extracted: ${finalUrls.length}/${maxImages}`);
  return finalUrls.slice(0, maxImages);
}

/**
 * Cleans and normalizes image URLs
 * @param imageUrl - Raw image URL
 * @returns Cleaned image URL
 */
function cleanImageUrl(imageUrl: string): string {
  // Handle protocol-relative URLs
  if (imageUrl.startsWith('//')) {
    imageUrl = 'https:' + imageUrl;
  }
  
  // Handle relative URLs (though rare for product images)
  if (imageUrl.startsWith('/') && !imageUrl.startsWith('//')) {
    imageUrl = 'https://amazon.com' + imageUrl;
  }
  
  // For Amazon images, try to get higher resolution versions
  if (imageUrl.includes('images-amazon.com') || imageUrl.includes('ssl-images-amazon.com')) {
    // Remove size restrictions to get full resolution
    imageUrl = imageUrl
      .replace(/\._AC_[A-Z]*\d*_/, '._AC_SL1500_')
      .replace(/\._SL\d*_/, '._SL1500_')
      .replace(/\._AC_US\d*_/, '._AC_SL1500_');
  }
  
  return imageUrl;
}

/**
 * Validates if a URL appears to be a valid image URL
 * @param imageUrl - Image URL to validate
 * @returns Boolean indicating if URL is valid
 */
function isValidImageUrl(imageUrl: string): boolean {
  try {
    const url = new URL(imageUrl);
    
    // Must be HTTP/HTTPS
    if (!['http:', 'https:'].includes(url.protocol)) {
      return false;
    }
    
    // Should contain 'image' or common image file extensions
    const urlString = imageUrl.toLowerCase();
    const hasImageIndicator = urlString.includes('image') || 
                             urlString.includes('.jpg') || 
                             urlString.includes('.jpeg') || 
                             urlString.includes('.png') || 
                             urlString.includes('.webp') ||
                             urlString.includes('media-amazon'); // Amazon specific
    
    // Skip obvious non-image files
    const hasNonImageIndicator = urlString.includes('.css') ||
                                urlString.includes('.js') ||
                                urlString.includes('.pdf') ||
                                urlString.includes('favicon');
    
    return hasImageIndicator && !hasNonImageIndicator;
    
  } catch {
    return false;
  }
}

/**
 * Scrapes product data from a given URL using Puppeteer and Cheerio
 * @param productUrl - The URL of the product page to scrape
 * @returns Promise containing the scraped product data or null if failed
 */
export async function scrapeProductData(productUrl: string): Promise<ProductData | null> {
  console.log(`🚀 Starting product scraping for: ${productUrl}`);
  
  // Validate URL and determine website
  const websiteKey = getWebsiteFromUrl(productUrl);
  if (!websiteKey) {
    console.error('❌ Unsupported website or invalid URL');
    return null;
  }
  
  const config = WEBSITE_CONFIGS[websiteKey];
  console.log(`⚙️ Using configuration for: ${config.name}`);
  
  return await scrapeWithPuppeteer(productUrl, config);
}

/**
 * Main Puppeteer scraping function
 * @param productUrl - The URL of the product page to scrape
 * @param config - Website configuration
 * @returns Promise containing the scraped product data or null if failed
 */
async function scrapeWithPuppeteer(productUrl: string, config: WebsiteConfig): Promise<ProductData | null> {
  
  let browser: Browser | null = null;
  let page: Page | null = null;
  
  try {
    // Launch Puppeteer browser
    console.log('🌐 Launching browser...');
    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-web-security',
        '--disable-features=VizDisplayCompositor',
        '--disable-extensions',
        '--disable-plugins',
        '--disable-default-apps',
        '--no-first-run',
        '--disable-background-timer-throttling',
        '--disable-backgrounding-occluded-windows',
        '--disable-renderer-backgrounding',
        '--window-size=1366,768'
      ],
      timeout: 60000,
      executablePath: undefined
    });
    
    page = await browser.newPage();
    
    // Configure page for better Amazon compatibility
    await page.setViewport({ 
      width: 1366, 
      height: 768,
      deviceScaleFactor: 1
    });
    
    // Set realistic user agent
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    
    // Set additional headers to look more like a real browser
    await page.setExtraHTTPHeaders({
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
      'Accept-Encoding': 'gzip, deflate, br',
      'DNT': '1',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1',
    });
    
    // Navigate to the product page
    console.log('📄 Loading product page...');
    const response = await page.goto(productUrl, { 
      waitUntil: 'domcontentloaded',
      timeout: 45000
    });
    
    if (!response || !response.ok()) {
      throw new Error(`Failed to load page: ${response?.status() || 'Unknown error'} - ${response?.statusText() || ''}`);
    }
    
    console.log(`✅ Page loaded successfully: ${response.status()}`);
    
    // Wait for images to potentially load and for any dynamic content
    console.log('⏳ Waiting for dynamic content to load...');
    
    // Wait for Amazon elements to load
    try {
      await page.waitForSelector('#landingImage, .a-dynamic-image, #productTitle', { timeout: 8000 });
    } catch {
      // Continue if elements aren't found immediately
    }
    
    // Wait for dynamic content
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Get page content
    const htmlContent = await page.content();
    console.log(`📝 Page content loaded: ${htmlContent.length} characters`);
    
    // Parse HTML with Cheerio
    const $ = cheerio.load(htmlContent);
    
    // Extract product information
    console.log('🔍 Extracting product information...');
    
    const title = extractTextFromSelectors($, config.titleSelectors);
    const description = extractTextFromSelectors($, config.descriptionSelectors);
    const imageUrls = extractImageUrls($, config.imageSelectors, config.maxImages);
    
    // Validate extracted data
    if (!title && !description && imageUrls.length === 0) {
      console.error('❌ No product data could be extracted');
      return null;
    }
    
    const productData: ProductData = {
      url: productUrl,
      title: title || 'Title not found',
      description: description || 'Description not found',
      imageUrls,
      website: config.name,
      scrapedAt: new Date()
    };
    
    console.log('✅ Product scraping completed successfully');
    console.log(`📊 Results: Title: ${title ? '✓' : '✗'}, Description: ${description ? '✓' : '✗'}, Images: ${imageUrls.length}`);
    
    return productData;
    
  } catch (error) {
    console.error('❌ Error during scraping:', error);
    return null;
  } finally {
    // Clean up resources with error handling
    try {
      if (page && !page.isClosed()) {
        console.log('🧹 Closing page...');
        await page.close();
      }
    } catch (closeError) {
      console.warn('⚠️ Warning: Error closing page:', closeError);
    }
    
    try {
      if (browser && browser.connected) {
        console.log('🧹 Closing browser...');
        await browser.close();
      }
    } catch (closeError) {
      console.warn('⚠️ Warning: Error closing browser:', closeError);
    }
  }
}

/**
 * Helper function to validate if a URL is from a supported website
 * @param url - The URL to validate
 * @returns boolean indicating if the website is supported
 */
export function isSupportedWebsite(url: string): boolean {
  return getWebsiteFromUrl(url) !== null;
}

/**
 * Get list of supported websites
 * @returns Array of supported website names
 */
export function getSupportedWebsites(): string[] {
  return Object.values(WEBSITE_CONFIGS).map(config => config.name);
}