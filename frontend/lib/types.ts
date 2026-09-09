export type PriceRange = {
  min: number;
  max: number;
  currency: string;
  approx?: boolean;
};

export type Site = {
  id: string;
  name: string;
  category: string;
  isGastronomic: boolean;
  rating: number | null;
  reviewCount: number | null;
  priceRange: PriceRange | null;
  note: string | null;
  city: string | null;
  address: string | null;
  mapsUrl: string | null;
};

export type ExtractSuccess = {
  success: true;
  partial: boolean;
  listName: string | null;
  totalSitesFound: number;
  gastronomicCount: number;
  sites: Site[];
  meta: {
    sourceUrl: string;
    scrapedAt: string;
    durationMs: number;
  };
};

export type ExtractErrorCode =
  | 'invalid_url'
  | 'not_a_list'
  | 'list_unreachable'
  | 'no_gastronomic_results'
  | 'scrape_timeout'
  | 'internal_error';

export type ExtractError = {
  success: false;
  errorCode: ExtractErrorCode;
  message: string;
};

export type ExtractResponse = ExtractSuccess | ExtractError;
