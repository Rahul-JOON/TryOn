import { NextRequest, NextResponse } from 'next/server';
import { scrapeProductData, isSupportedWebsite } from '../../../utils/productScraper';

/**
 * API Route handler for scraping product data
 * POST /api/scrape
 * 
 * Accepts a JSON body with:
 * - url: string - The product URL to scrape
 * 
 * Returns:
 * - 200: Scraped product data
 * - 400: Invalid request or unsupported website
 * - 500: Server error during scraping
 */
export async function POST(request: NextRequest) {
  try {
    console.log('🔍 API: Received scraping request');
    
    // Parse request body
    const body = await request.json();
    const { url } = body;
    
    // Validate request
    if (!url || typeof url !== 'string') {
      console.error('❌ API: Invalid URL provided');
      return NextResponse.json(
        { error: 'URL is required and must be a string' },
        { status: 400 }
      );
    }
    
    console.log(`🔍 API: Processing URL: ${url}`);
    
    // Check if website is supported
    if (!isSupportedWebsite(url)) {
      console.error('❌ API: Unsupported website');
      return NextResponse.json(
        { error: 'Unsupported website. Currently only Amazon is supported.' },
        { status: 400 }
      );
    }
    
    // Perform scraping
    console.log('🚀 API: Starting scraping process');
    const scrapedData = await scrapeProductData(url);
    
    if (!scrapedData) {
      console.error('❌ API: Scraping failed - no data returned');
      return NextResponse.json(
        { error: 'Failed to scrape product data. The page might be inaccessible or the selectors need updating.' },
        { status: 500 }
      );
    }
    
    console.log('✅ API: Scraping completed successfully');
    return NextResponse.json({
      success: true,
      data: scrapedData
    });
    
  } catch (error) {
    console.error('❌ API: Server error during scraping:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    return NextResponse.json(
      { 
        error: 'Server error during scraping',
        details: errorMessage
      },
      { status: 500 }
    );
  }
}

/**
 * Health check endpoint for the scraping API
 * GET /api/scrape
 */
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    message: 'Product scraping API is running',
    supportedWebsites: ['Amazon']
  });
}