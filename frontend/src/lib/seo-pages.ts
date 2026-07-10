export type SeoToolPage = {
  slug: string;
  title: string;
  description: string;
  eyebrow: string;
  h1: string;
  intro: string;
  recommendedOutput: string;
  useCase: string;
  outputs: string[];
  faqs: Array<{
    question: string;
    answer: string;
  }>;
  sourceLinks?: Array<{
    label: string;
    href: string;
  }>;
};

export const SEO_TOOL_PAGES: SeoToolPage[] = [
  {
    slug: "marketplace-image-resizer",
    title: "Marketplace Image Resizer for Sellers",
    description:
      "Resize product photos into Amazon, Etsy, Shopify, Meta, WhatsApp, and website image packs from one upload.",
    eyebrow: "Marketplace image workflow",
    h1: "Marketplace Image Resizer",
    intro:
      "Prepare one product photo for multiple selling channels without manually cropping, renaming, and exporting every size.",
    recommendedOutput:
      "Use the default seller pack for Amazon, Shopify, Meta Feed, and Website WebP outputs.",
    useCase:
      "Best for sellers, net cafes, and agencies that prepare product listings for several platforms in one sitting.",
    outputs: [
      "Amazon main image: 2000 x 2000 JPG",
      "Shopify product image: 2048 x 2048 JPG",
      "Meta Feed image: 1080 x 1080 JPG",
      "Website product image: 1600 x 1600 WebP",
    ],
    faqs: [
      {
        question: "Can I resize multiple product photos at once?",
        answer:
          "Yes. Upload a batch and the tool creates per-product folders inside one ZIP.",
      },
      {
        question: "Are original images stored permanently?",
        answer:
          "No. The backend processes temporary files and returns a ZIP. Only optional metadata is saved for logged-in users.",
      },
    ],
  },
  {
    slug: "amazon-product-image-resizer",
    title: "Amazon Product Image Resizer",
    description:
      "Create square 2000 x 2000 JPG product images with white canvas padding for Amazon listing preparation.",
    eyebrow: "Amazon product images",
    h1: "Amazon Product Image Resizer",
    intro:
      "Turn product photos into square Amazon-ready JPG exports with clean naming and ZIP download.",
    recommendedOutput:
      "Amazon Main preset: 2000 x 2000 JPG with white canvas padding.",
    useCase:
      "Use this when preparing catalog or main listing images before uploading them to Seller Central.",
    outputs: [
      "2000 x 2000 JPG export",
      "White canvas padding",
      "Clean folder and file naming",
      "Batch ZIP with report.json",
    ],
    faqs: [
      {
        question: "Does this remove the background automatically?",
        answer:
          "Not yet. It adds a white canvas and preserves transparent products. True background removal is planned for a later AI phase.",
      },
      {
        question: "Why use 2000 x 2000?",
        answer:
          "It stays comfortably above Amazon zoom guidance while keeping output predictable for seller workflows.",
      },
    ],
    sourceLinks: [
      {
        label: "Amazon product image guide",
        href: "https://sellercentral.amazon.com/help/hub/reference/external/G1881?locale=en-US",
      },
    ],
  },
  {
    slug: "etsy-listing-image-resizer",
    title: "Etsy Listing Image Resizer",
    description:
      "Resize Etsy listing photos into high-resolution 2000 x 2000 JPG files for clean shop presentation.",
    eyebrow: "Etsy listing photos",
    h1: "Etsy Listing Image Resizer",
    intro:
      "Prepare Etsy product photos with consistent dimensions, clean folders, and seller-friendly ZIP export.",
    recommendedOutput: "Etsy Listing preset: 2000 x 2000 JPG.",
    useCase:
      "Best for handmade shops, boutiques, printable sellers, and product photo batches.",
    outputs: [
      "2000 x 2000 JPG listing image",
      "Consistent square product framing",
      "Batch processing for multiple products",
      "ZIP export for upload preparation",
    ],
    faqs: [
      {
        question: "What size should Etsy listing photos be?",
        answer:
          "Etsy recommends listing photos with width and height of at least 2000 pixels or more.",
      },
      {
        question: "Can I prepare a whole Etsy product batch?",
        answer:
          "Yes. Upload multiple images and download one ZIP with each product in its own folder.",
      },
    ],
    sourceLinks: [
      {
        label: "Etsy image requirements",
        href: "https://help.etsy.com/hc/en-us/articles/115015663347-Requirements-and-Best-Practices-for-Images-in-Your-Etsy-Shop",
      },
    ],
  },
  {
    slug: "shopify-product-image-resizer",
    title: "Shopify Product Image Resizer",
    description:
      "Generate 2048 x 2048 Shopify product images and website WebP versions for ecommerce catalogs.",
    eyebrow: "Shopify product images",
    h1: "Shopify Product Image Resizer",
    intro:
      "Standardize product photos for Shopify stores with square JPG output and optimized website versions.",
    recommendedOutput:
      "Shopify Product preset: 2048 x 2048 JPG, plus Website WebP for faster storefront usage.",
    useCase:
      "Best for store owners and operators who need consistent product grids and zoom-friendly images.",
    outputs: [
      "2048 x 2048 JPG product image",
      "1600 x 1600 WebP website image",
      "Batch ZIP export",
      "Per-product folder naming",
    ],
    faqs: [
      {
        question: "Why use square Shopify product images?",
        answer:
          "Square product images keep catalog grids consistent and are easier to reuse across marketplaces.",
      },
      {
        question: "Can I also create WebP images?",
        answer:
          "Yes. Select Website WebP together with Shopify Product to get both store and optimized web files.",
      },
    ],
    sourceLinks: [
      {
        label: "Shopify image size guide",
        href: "https://www.shopify.com/blog/image-sizes",
      },
    ],
  },
  {
    slug: "facebook-ad-image-resizer",
    title: "Facebook Ad Image Resizer",
    description:
      "Create Facebook ad image sizes including 1080 x 1080 square and 1080 x 1350 vertical creative.",
    eyebrow: "Facebook ad creatives",
    h1: "Facebook Ad Image Resizer",
    intro:
      "Prepare product ad creatives for Meta placements without manually exporting each ratio.",
    recommendedOutput:
      "Use Meta Feed and Instagram Portrait presets together for 1:1 and 4:5 outputs.",
    useCase:
      "Best for sellers and agencies preparing product ads for Facebook and Instagram campaigns.",
    outputs: [
      "1080 x 1080 JPG feed image",
      "1080 x 1350 JPG portrait image",
      "1080 x 1920 JPG story/reel image",
      "ZIP export for campaign assets",
    ],
    faqs: [
      {
        question: "Which Meta ratios are included?",
        answer:
          "The tool includes 1:1, 4:5, and 9:16 presets for feed, portrait, and story/reel placements.",
      },
      {
        question: "Can I generate ads for many products?",
        answer:
          "Yes. Batch upload product photos and create the selected ad sizes for every image.",
      },
    ],
    sourceLinks: [
      {
        label: "Meta aspect ratio guidance",
        href: "https://www.facebook.com/business/help/103816146375741",
      },
    ],
  },
  {
    slug: "instagram-ad-image-resizer",
    title: "Instagram Ad Image Resizer",
    description:
      "Resize product photos into Instagram feed, portrait, story, and reel image formats.",
    eyebrow: "Instagram ad sizes",
    h1: "Instagram Ad Image Resizer",
    intro:
      "Generate Instagram square, portrait, and full-screen creative from one product photo upload.",
    recommendedOutput:
      "Use Meta Square, Instagram Portrait, and Story/Reel presets for Instagram campaigns.",
    useCase:
      "Best for shops, boutiques, cosmetics sellers, and agencies running Instagram product campaigns.",
    outputs: [
      "1080 x 1080 JPG square",
      "1080 x 1350 JPG portrait",
      "1080 x 1920 JPG story/reel",
      "Batch ZIP for multiple products",
    ],
    faqs: [
      {
        question: "Is 4:5 supported?",
        answer:
          "Yes. The Instagram Portrait preset exports 1080 x 1350 JPG for vertical feed creative.",
      },
      {
        question: "Can I use the same source image for story format?",
        answer:
          "Yes. The tool pads and resizes onto a 1080 x 1920 canvas.",
      },
    ],
    sourceLinks: [
      {
        label: "Meta aspect ratio guidance",
        href: "https://www.facebook.com/business/help/103816146375741",
      },
    ],
  },
  {
    slug: "whatsapp-catalog-image-resizer",
    title: "WhatsApp Catalog Image Resizer",
    description:
      "Create 1000 x 1000 compressed product images for WhatsApp catalog and local selling workflows.",
    eyebrow: "WhatsApp catalog images",
    h1: "WhatsApp Catalog Image Resizer",
    intro:
      "Prepare clean square product images for WhatsApp catalogs, local sellers, and quick customer sharing.",
    recommendedOutput: "WhatsApp Catalog preset: 1000 x 1000 compressed JPG.",
    useCase:
      "Best for boutiques, mobile shops, cosmetics sellers, and net cafes preparing catalog images.",
    outputs: [
      "1000 x 1000 compressed JPG",
      "Square product framing",
      "Clean product filenames",
      "Batch ZIP for daily catalog work",
    ],
    faqs: [
      {
        question: "Is this good for local sellers?",
        answer:
          "Yes. The preset is intentionally simple, square, and compressed for fast catalog sharing.",
      },
      {
        question: "Can net cafes use this for customer work?",
        answer:
          "Yes. Use project folder names to keep each client batch organized.",
      },
    ],
  },
  {
    slug: "product-photo-compressor",
    title: "Product Photo Compressor",
    description:
      "Compress and resize ecommerce product photos while generating marketplace and website-ready outputs.",
    eyebrow: "Product compression",
    h1: "Product Photo Compressor",
    intro:
      "Compress product images as part of a full seller workflow instead of creating one generic small file.",
    recommendedOutput:
      "Use Website WebP for optimized web files and marketplace presets for upload-ready images.",
    useCase:
      "Best for ecommerce images that need smaller web files plus marketplace-ready exports.",
    outputs: [
      "Optimized JPG outputs",
      "WebP website image",
      "Before/after size report in ZIP metadata",
      "Batch processing",
    ],
    faqs: [
      {
        question: "Is this only a compressor?",
        answer:
          "No. Compression is included, but the main workflow creates seller image packs by platform.",
      },
      {
        question: "Does it support WebP?",
        answer:
          "Yes. The Website WebP preset exports optimized WebP files.",
      },
    ],
  },
  {
    slug: "bulk-product-image-resizer",
    title: "Bulk Product Image Resizer",
    description:
      "Bulk resize product photos into marketplace, ads, catalog, and website image folders.",
    eyebrow: "Bulk image workflow",
    h1: "Bulk Product Image Resizer",
    intro:
      "Upload a batch of product photos and create every selected seller output in one ZIP.",
    recommendedOutput:
      "Use saved presets for repeat net cafe, agency, and catalog jobs.",
    useCase:
      "Best for agencies, net cafes, and stores with many products to prepare at once.",
    outputs: [
      "Batch ZIP output",
      "Per-product folders",
      "Saved preset combinations",
      "Usage metadata for logged-in users",
    ],
    faqs: [
      {
        question: "How many images can I batch process?",
        answer:
          "The current MVP batch limit is 30 images. Paid plans can raise this later.",
      },
      {
        question: "How are files organized?",
        answer:
          "The ZIP contains one project folder, then one folder per product, then all selected outputs.",
      },
    ],
  },
  {
    slug: "website-image-optimizer",
    title: "Website Image Optimizer",
    description:
      "Create optimized ecommerce website product images including WebP and compressed JPG outputs.",
    eyebrow: "Website optimization",
    h1: "Website Image Optimizer",
    intro:
      "Generate website-friendly product images for faster storefronts and cleaner product presentation.",
    recommendedOutput:
      "Website WebP preset: 1600 x 1600 WebP, optionally with Shopify Product JPG.",
    useCase:
      "Best for ecommerce stores, landing pages, product catalogs, and web designers.",
    outputs: [
      "1600 x 1600 WebP",
      "Optimized JPG alternatives",
      "Batch output folders",
      "Report metadata",
    ],
    faqs: [
      {
        question: "Why use WebP for product images?",
        answer:
          "WebP usually gives smaller file sizes than JPG while keeping good visual quality for web pages.",
      },
      {
        question: "Can I keep marketplace JPGs too?",
        answer:
          "Yes. Select Website WebP together with Amazon, Shopify, or Meta presets.",
      },
    ],
  },
  {
    slug: "convert-product-image-to-webp",
    title: "Convert Product Image to WebP",
    description:
      "Convert product photos to optimized WebP files for ecommerce websites and landing pages.",
    eyebrow: "WebP conversion",
    h1: "Convert Product Image to WebP",
    intro:
      "Turn product JPG, PNG, or WebP uploads into optimized WebP outputs for website use.",
    recommendedOutput: "Website WebP preset: 1600 x 1600 WebP.",
    useCase:
      "Best for site owners who want lighter product media without losing the seller pack workflow.",
    outputs: [
      "WebP product image",
      "Square website canvas",
      "Batch ZIP export",
      "Optional marketplace JPGs",
    ],
    faqs: [
      {
        question: "Can I upload PNG files?",
        answer:
          "Yes. The backend accepts JPG, PNG, and WebP uploads.",
      },
      {
        question: "Will transparent PNGs work?",
        answer:
          "Transparent products are flattened onto the preset canvas for consistent marketplace exports.",
      },
    ],
  },
];

export function getSeoToolPage(slug: string) {
  return SEO_TOOL_PAGES.find((page) => page.slug === slug);
}
