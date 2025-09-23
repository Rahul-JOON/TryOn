'use client';

import { useState } from 'react';

/**
 * Interface defining the structure of scraped product data
 * This matches the ProductData interface from the server-side scraper
 */
interface ProductData {
  url: string;
  title: string;
  description: string;
  imageUrls: string[];
  website: string;
  scrapedAt: string; // Note: Will be string when received from API
}

/**
 * Interface for API responses
 */
interface ApiResponse {
  success?: boolean;
  data?: ProductData;
  error?: string;
  details?: string;
}

/**
 * Helper function to validate if a URL appears to be from Amazon
 * @param url - The URL to validate
 * @returns boolean indicating if it looks like an Amazon URL
 */
function isAmazonUrl(url: string): boolean {
  try {
    const domain = new URL(url).hostname.toLowerCase();
    return domain.includes('amazon.');
  } catch {
    return false;
  }
}

/**
 * Test page component for testing the product scraper functionality
 * Provides a simple UI to input URLs and display scraped results via API calls
 */
export default function TestScraperPage() {
  // State management for the component
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<ProductData | null>(null);
  const [error, setError] = useState<string | null>(null);

  /**
   * Handles the form submission and initiates the scraping process via API
   * @param e - Form submission event
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Reset previous state
    setError(null);
    setResult(null);
    
    // Validate URL input
    if (!url.trim()) {
      setError('Please enter a valid URL');
      return;
    }

    // Basic URL validation
    try {
      new URL(url);
    } catch {
      setError('Please enter a valid URL format');
      return;
    }

    // Check if website appears to be supported (basic client-side check)
    if (!isAmazonUrl(url)) {
      setError('Unsupported website. Currently supported: Amazon');
      return;
    }

    // Start scraping process via API
    setIsLoading(true);
    console.log('🔄 Starting API scraping request for:', url);

    try {
      // Make API request to scrape endpoint
      const response = await fetch('/api/scrape', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      });

      const apiResponse: ApiResponse = await response.json();
      console.log('📡 API Response:', apiResponse);

      if (response.ok && apiResponse.success && apiResponse.data) {
        setResult(apiResponse.data);
        console.log('✅ Scraping completed successfully via API:', apiResponse.data);
      } else {
        const errorMsg = apiResponse.error || 'Failed to scrape product data';
        const details = apiResponse.details ? ` Details: ${apiResponse.details}` : '';
        setError(`${errorMsg}${details}`);
        console.error('❌ API scraping failed:', apiResponse);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Network error occurred';
      setError(`API Error: ${errorMessage}`);
      console.error('❌ API request error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Clears all current state and resets the form
   */
  const handleClear = () => {
    setUrl('');
    setResult(null);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Product Scraper Test
          </h1>
          <p className="text-gray-600 mb-4">
            Test the web scraping functionality by entering a product URL
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-800">
              <strong>Supported websites:</strong> Amazon
            </p>
          </div>
        </div>

        {/* URL Input Form */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="url" className="block text-sm font-medium text-gray-700 mb-2">
                Product URL
              </label>
              <div className="flex space-x-2">
                <input
                  type="url"
                  id="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://www.amazon.com/product-page-url"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={isLoading}
                />
                <button
                  type="submit"
                  disabled={isLoading || !url.trim()}
                  className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                  {isLoading ? (
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Scraping...</span>
                    </div>
                  ) : (
                    'Scrape'
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleClear}
                  className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
                >
                  Clear
                </button>
              </div>
            </div>

            {/* Simple example */}
            <div className="bg-gray-50 rounded p-3">
              <p className="text-xs text-gray-600 mb-1">Example: Paste any Amazon product URL to test</p>
            </div>
          </form>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <p className="mt-1 text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Results Display */}
        {result && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Scraped Results</h2>
            
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Product Information</h3>
                <div className="space-y-2">
                  <div>
                    <span className="font-medium text-gray-600">Website:</span>
                    <span className="ml-2 text-gray-900">{result.website}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Scraped:</span>
                    <span className="ml-2 text-gray-900">
                      {new Date(result.scrapedAt).toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Images Found:</span>
                    <span className="ml-2 text-gray-900">{result.imageUrls.length}</span>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Original URL</h3>
                <a 
                  href={result.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 break-all text-sm"
                >
                  {result.url}
                </a>
              </div>
            </div>

            {/* Product Title */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Product Title</h3>
              <p className="text-gray-900 bg-gray-50 p-3 rounded border">
                {result.title}
              </p>
            </div>

            {/* Product Description */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Description</h3>
              <p className="text-gray-900 bg-gray-50 p-3 rounded border">
                {result.description}
              </p>
            </div>

            {/* Product Images */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                Product Images ({result.imageUrls.length})
              </h3>
              {result.imageUrls.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {result.imageUrls.map((imageUrl, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                      <div className="mb-2">
                        <span className="text-sm font-medium text-gray-600">
                          Image {index + 1}:
                        </span>
                      </div>
                      <img
                        src={imageUrl}
                        alt={`Product image ${index + 1}`}
                        className="w-full h-64 object-contain bg-gray-50 rounded border"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          const parent = target.parentNode as HTMLElement;
                          if (parent) {
                            parent.innerHTML += '<div class="w-full h-64 bg-red-50 rounded border flex items-center justify-center"><span class="text-red-600">Failed to load image</span></div>';
                          }
                        }}
                      />
                      <div className="mt-2">
                        <a 
                          href={imageUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-xs text-blue-600 hover:text-blue-800 break-all"
                        >
                          {imageUrl}
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 italic">No images found</p>
              )}
            </div>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-blue-800">Scraping product data...</p>
          </div>
        )}

        {/* Console Log Notice */}
        <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-sm text-yellow-800">
            <strong>Developer Note:</strong> Detailed scraping logs are available in the browser console (F12). 
            This includes step-by-step progress and any debugging information.
          </p>
        </div>
      </div>
    </div>
  );
}